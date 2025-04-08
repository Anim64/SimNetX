let graph = null;
let currentGraph = null;
let store = null;
let dataStore = null;
let filterNodeList = [];
let linkedByIndex = {};
let attributefilter = {};

let node = null;
let link = null;

let selectionGraph = null;
let selectionNode = null;
let selectionLink = null;
let selectionDraw = null;


let rect = null;
let gBrushHolder = null;
let gBrush = null;
let brushMode = false;
let brushing = false;
let brush = null;
let gDraw = null;
let gNodes = null;
let gMain = null;
let nodeGroups = null;
let nodeText = null;
let grads = null;
let transformX = 0;
let transformY = 0;
let scaleK = 1;

const simulationDurationInMs = 20000; // 20 seconds

let startTime = null;
let endTime = null;

const jsPath = '../js/PropertyWorkers/';

   

//let width = d3.select("#networkGraph svg").node().parentNode.clientWidth;
//let height = d3.select("#networkGraph svg").node().parentNode.clientHeight;

let { width, height } = d3.select("#networkGraph svg").node().parentNode.getBoundingClientRect();


const svg = d3.select("#networkGraph svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", "100%")
    //.attr("height", height + "px")
    .attr("preserveAspectRatio", "none");
    
let selectionSvg = null;



let selectionSimulation = d3.forceSimulation()
    .force("link", d3.forceLink())
    .force("charge", d3.forceManyBody())
    .force("collide", d3.forceCollide())
    .force("center", d3.forceCenter())
    .force("forceX", d3.forceX())
    .force("forceY", d3.forceY())
    //.force("radial", d3.forceRadial());

const palette = ["#FF355E", "#FD5B78", "#FF6037", "#FF9966", "#FF9933",
    "#FFCC33", "#FFFF66", "#CCFF00", "#66FF66", "#AAF0D1",
    "#50BFE6", "#FF6EFF", "#EE34D2", "#FF00CC", "#FF3855", "#FD3A4A", "#FB4D46",
    "#FA5B3D", "#FFAA1D", "#FFF700", "#299617", "#A7F432", "#2243B6", "#5DADEC",
    "#5946B2", "#9C51B6", "#A83731", "#AF6E4D", "#1B1B1B", "#BFAFB2", "#FF5470", "#FFDB00",
    "#FF7A00", "#FDFF00", "#87FF2A","#0048BA","#FF007C","#E936A7"];
const groupColours = d3.scaleOrdinal().range(palette);

const xScale = d3.scaleLinear()
    .domain([0, width]).range([0, width]);
const yScale = d3.scaleLinear()
    .domain([0, height]).range([0, height]);

let selectedNode = null;
let shiftKey = null;


const nodeVisualProperties = {
    sizing: {
        enabled: false,
        attribute: ""
    },
    colouring: {
        lastColouringType: "mono"
    },
    labels: {
        enabled: true,
        attribute: "id"
    }
}

const prepareLinks = function() {
    //Create line or curves in SVG
    
    link = gDraw.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(currentGraph.links)
        .enter().append("path");

    link.append("title")
        .text(function (l) {
            return l.id;
        });

}

const prepareNodes = function () {
    //Create node circles in SVG
    gNodes = gDraw.append("g")
        .attr("class", "nodes")
        .attr("id", "nodes")
        .selectAll("circle")
        .data(currentGraph.nodes);

    nodeGroups = gNodes.enter()
        .append("g")
        .attr("class", "node-group")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node = nodeGroups.append("circle")
        .attr("r", currentGraph.getForcePropertyValue("collide", "radius"))
        .on("mouseover", nodeMouseOver(.2))
        .on("mouseout", mouseOut);

    currentGraph.updateSimulationTick(ticked);
    currentGraph.updateSimulationEnd(simulationEnd);
    
}


const prepareText = function () {
    nodeText = nodeGroups.append("text")
        .text(function (d) { return d.id; })
        .attr("id", function (d) { return d.id + '_node_text'; })
        .attr("text-anchor", "middle")
        .on("mouseover", nodeMouseOver(.2))
        .on("mouseout", mouseOut);

    const radius = currentGraph.getForcePropertyValue("collide", "radius");
    setNodeFontSize(radius);
        
}

const setNodeFontSize = function (r = null) {
    nodeText
        .attr("font-size", function (d) {
            const resultR = r === null ? d.r : r;
            return resultR * 0.85;
        })
        .attr("dy", function (d) {
            const resultR = r === null ? d.r : r;
            return resultR / 3;
        });
}

const prepareBrush = function() {
    gBrushHolder = gMain.append('g');

    brushMode = false;
    brushing = false;

    brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("start", brushstarted)
        .on("brush", brushed)
        .on("end", brushended);
}

const prepareZoom = function() {
    //Define zoom function
    const zoom = d3.zoom()
        .on('zoom', zoomed);

    gMain.call(zoom);
}

const prepareNetworkBackground = function() {
    //Background rectangle
    rect = gMain.append('rect')
        .attr("class", "background")
        .attr("id", "network-background-rect")
        .attr('width', width + "px")
        .attr('height', height + "px")
        .on('click', deselectAllNodes);
}

const prepareCanvas = function () {
    svg.selectAll('.g-main').remove();

    

    gMain = svg.append('g')
        .classed('g-main', true)

    prepareNetworkBackground();

    gDraw = gMain.append('g');
   

    prepareBrush();
    prepareZoom();

    d3.select('body').on('keydown', keydown);
    d3.select('body').on('keyup', keyup);
}



//Draw graph of the network
const drawNetwork = function (data) {
    prepareLinks();
    prepareNodes();
    prepareText();
}

const createDataGraphObjects = function (data) {
    const { graph: init_graph, data: nodeData } = data;
    dataStore = new DataStore(nodeData);
    currentGraph = new Graph(init_graph, dataStore, width, height);
}

const initGraph = function (data) {
    prepareCanvas();
    createDataGraphObjects(data);
    drawNetwork(data);
    updateForces();
    setDefaultNodeAndLinkColour(node, link);
}


//Draw selection graph
const drawSelectionNetwork = function(data) {
    selectionGraph = data;
    

    selectionSvg = d3.select("#selectionGraph svg")
        .attr('width', width)
        .attr('height', height);
    selectionSvg.selectAll('.g-main').remove();

    let selectionMain = selectionSvg.append('g')
        .classed('g-main', true);

    /*var defs = selectionMain.append("defs");

    //Edge arrow definition
    defs.append("marker")
        .attr("id", "selection_arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
        .attr("class", "arrow")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");*/

    let zoom = d3.zoom()
        .on('zoom', selectionZoomed)

    selectionMain.call(zoom);


    //Background rectangle
    let selectionRect = selectionMain.append('rect')
        .attr('width', width)
        .attr('height', height)
        .style('fill', '#1A1A1A')

    selectionDraw = selectionMain.append('g');


    //Create lines or curves for graph
    selectionLink = selectionDraw.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(selectionGraph.links)
        .enter().append("path")
        .attr("id", function (l) {
            return "selection_link_" + l.source + "-" + l.target;
        });

    selectionLink.append("title")
        .text(function (l) {
            return l.value;
        });


    //Create nodes circles for graph
    selectionNode = selectionDraw.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(selectionGraph.nodes)
        .enter().append("circle")
        .style("fill", function (d) {
            
            return groupColours(d.id);
        })
        .attr("r", function (d) {
            const radius = currentGraph.getForcePropertyValue("collide", "radius");
            return radius + Math.sqrt(d.nonodes);
        })
        .attr("id", function (d) {
            return "selection_node_" + d.id;
        })
        /*.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));*/

    
    selectionNode.append("title")
        .text(function (d) { return "Number of Nodes: " + d.nonodes; });

    selectionSimulation
        .nodes(selectionGraph.nodes)
        .on("tick", selectionTicked);

    updateSelectionForces();
    /*selectionSimulation.force("link")
        .links(selectionGraph.links);*/

    
}


/////////////////////////////////////////////MOUSE OVER///////////////////////////////////////////////////

// check the dictionary to see if nodes are linked


//TBR
//const isConnected = function(nodeId1, nodeId2) {
//    return linkedByIndex[nodeId1 + "," + nodeId2] || linkedByIndex[nodeId2 + "," + nodeId1] || nodeId1 === nodeId2;
//}

const fadeDisconnectedNodes = function(nodeId, opacity) {
    // check all other nodes to see if they're connected
    // to this one. if so, keep the opacity at 1, otherwise
    // fade

    
    node.attr("r", function (d) {
        return nodeId === d.id ? d.r * 2 : d.r;
    });

    node.style("stroke-opacity", function (o) {
        this.Opacity = currentGraph.isConnected(nodeId, o.id) ? 1 : opacity;
        return this.Opacity;
    });
    node.style("fill-opacity", function (o) {
        this.Opacity = currentGraph.isConnected(nodeId, o.id) ? 1 : opacity;
        return this.Opacity;
    });
    // also style link accordingly
    link.style("stroke-opacity", function (o) {
        return o.source.id === nodeId || o.target.id === nodeId ? 1 : opacity;
    });
    /*link.style("stroke", function (o) {
        return o.source.id === nodeId || o.target.id === nodeId ? o.source.colour : getNodeColour(o.source.id);
    });*/
}
// fade nodes on hover
const nodeMouseOver = function(opacity) {
    return function (d) {
        fadeDisconnectedNodes(d.id, opacity);
    };
}

const mouseOut = function() {
    node.attr("r", function (d) {
        return d.r;
    });
    
    node.style("stroke-opacity", 1);
    node.style("fill-opacity", 1);
    link.style("stroke-opacity", 1);
    /*link.style("stroke", function (d) {
        return getNodeColour(d.source.id);
    });*/
}

/******************************************MOUSE OVER END**************************************************/


/////////////////////////////////////////////DRAGGING/////////////////////////////////////////////

//Function for node dragging start
const dragstarted = function (d) {
    if (!d3.event.active)
        //resetSimulation();
    
    if (!d.selected && !shiftKey) {
        // if this node isn't selected, then we have to unselect every other node
        nodeGroups.classed("selected", function (p) { return p.selected = p.previouslySelected = false; });
    }

    d3.select(this).classed("selected", true);
    d.previouslySelected = d.selected;
    d.selected = true;
}

//Function for node dragging
const dragged = function(d) {
    //d.fx = d3v4.event.x;
    //d.fy = d3v4.event.y;
    const { dx, dy } = d3.event;
    d3.selectAll('.selected')
        .each(function (d) {
            d.x += dx;
            d.y += dy;
            d.fx += dx;
            d.fy += dy;
        });
    ticked();
    
}



//Function for node dragging end
const dragended = function(d) {
    if (!d3.event.active)
        currentGraph.simulation.alphaTarget(0);

    const { id: nodeId, index: nodeIndex } = d;
    toggleNodeDetails(nodeId, nodeIndex);
    showNodeNeighbors(nodeId);
}

/******************************************DRAGGING END**************************************************/


////////////////////////////////BRUSHING/////////////////////////////////

//Function for node brushing start
const brushstarted = function() {
    // keep track of whether we're actively brushing so that we
    // don't remove the brush on keyup in the middle of a selection
    brushing = true;

    node.each(function (d) {
        d.previouslySelected = shiftKey && d.selected;
    });

}

//Function for node brushing
const brushed = function() {
    if (!d3.event.sourceEvent) return;
    if (!d3.event.selection) return;

    const extent = d3.event.selection;
    const [[left, top],[right, bottom]] = extent;


    nodeGroups.classed("selected", function (d) {
        const { previouslySelected, x, y } = d;
        d.selected = previouslySelected |
            (left <= ((x * scaleK) + transformX) && ((x * scaleK) + transformX) < right
                && top <= ((y * scaleK) + transformY) && ((y * scaleK) + transformY) < bottom);
        
        return d.selected
    });
}

//Function for node brushing end
const brushended = function() {
    if (!d3.event.sourceEvent) return;
    if (!d3.event.selection) return;
    if (!gBrush) return;

    gBrush.call(brush.move, null);

    if (!brushMode) {
        // the shift key has been release before we ended our brushing
        gBrush.remove();
        gBrush = null;
    }

    brushing = false;
    drawSelectedNodesHistogram();
}

//On shift key event
const keydown = function () {
    shiftKey = d3.event.ctrlKey;

    if (shiftKey) {
        // if we already have a brush, don't do anything
        if (gBrush)
            return;

        brushMode = true;

        if (!gBrush) {
        gBrush = gBrushHolder.append('g')
        gBrush.call(brush);
    }
}
}

//On shift key event
const keyup = function() {
    shiftKey = false;
    brushMode = false;

    if (!gBrush)
        return;

    if (!brushing) {
        // only remove the brush if we're not actively brushing
        // otherwise it'll be removed when the brushing ends
        gBrush.remove();
        gBrush = null;
    }
}

const deselectAllNodes = function() {
    //node.each(function (d) {
    //    d.selected = false;
    //    d.previouslySelected = false;
    //});
    nodeGroups.classed("selected", function (d) {
        return d.selected = d.previouslySelected = false;
    });

    const { num: numAttributes = [] } = currentGraph.attributes;
    for (const attribute of numAttributes) {
        const containerDivId = `${attribute}-histogram-container`;
        const attributeValues = currentGraph.getAllAttributeValues(attribute);

        hist(containerDivId, attributeValues, attribute, 300, 100);

    }
    
}

const drawSelectedNodesHistogram = function () {
    const selectedNodes = nodeGroups.filter(d => d.selected);
    if (selectedNodes.size() <= 0) {
        return;
    }

    if (selectedNodes.size() === 1) {
        const { id, index } = selectedNodes.node().__data__;
        nodeHeadingClick(id, index);
        return;
    }

    showNodeValuesInHistogram(selectedNodes);
    //TODO to be removed
    //const { num: numAttributes = [] } = currentGraph.attributes;
    //for (const attribute of numAttributes) {
    //    const containerDivId = `${attribute}-histogram-container`;
    //    const attributeValues = [];
    //    selectedNodes.each(function (d) {
    //        attributeValues.push(currentGraph.getNodeDataValue(d.id, attribute));
    //    });

    //    hist(containerDivId, attributeValues, attribute, 300, 100);
    //}
}

/************************************************END BRUSHING **********************************************/

///////////////////////////////////////////////ZOOM/////////////////////////////////////////////////
//Calculate zoom
const zoomed = function() {
    
    const {x, y, k} = d3.event.transform;
    transformX = x;
    transformY = y;
    scaleK = k;
    gDraw.attr("transform", `translate(${transformX},${transformY}) scale(${scaleK})`);
    //gBrushHolder.attr("transform", `translate(${transformX},${transformY})`);
}


//Calculate zoom

const selectionZoomed = function () {
    selectionDraw.attr("transform", d3.event.transform);
}


/************************************************** ZOOM ******************************************************/

///////////////////////////////////////// GRAPH SIMULATION ///////////////////////////////////////////////

//Update graph simulation forces
const updateForces = function(reset = true) {
    updateCenterForce();
    updateChargeForce();
    updateCollideForce();
    updateLinkForce();

    if (reset) {
        startSimulation();
    }
}

//TBR
const updateCenterForce = function () {
    currentGraph.updateCenterForce();
}

const updateChargeForce = function () {
    currentGraph.updateChargeForce();
}

const updateCollideForce = function () {
    currentGraph.updateCollideForce();

    const radius = currentGraph.getForcePropertyValue("collide", "radius");
    if (nodeVisualProperties.sizing.enabled) {
        node.attr("r", function (d) {
            const previousRadius = currentGraph.getForcePropertyValue("collide", "radius");
            const resultRadius = ((d.r - 1) / (previousRadius)) * (radius) + 1;
            return d.r = resultRadius;
        });
        return;
    }
    node.attr("r", function (d) {
        return d.r = radius;
    });
}

const updateLinkForce = function () {
    currentGraph.updateLinkForce();
    const linksEnabled = currentGraph.getForcePropertyValue("link", "enabled");
    link
        .attr("stroke-width", linksEnabled ? 1 : .5)
        .attr("opacity", linksEnabled ? 1 : 0);
}

//const resetSimulation = function() {
//    startTime = Date.now();
//    endTime = startTime + simulationDurationInMs;
//    //simulation.start();
//    simulation.alpha(1).restart();
//}



/******************************************END GRAPH SIMULATION ***********************************************/


///////////////////////////////////////// SELECTION SIMULATION ///////////////////////////////////////////////


//Update selection graph simulation forces
const updateSelectionForces = function () {

    const forceProperties = currentGraph.forces;
    const { x, y } = forceProperties.center;
    selectionSimulation.force("center")
        .x(width * x)
        .y(height * y);

    const { strength: chargeStrength, enabled: chargeEnabled, distanceMin, distanceMax } = forceProperties.charge;
    selectionSimulation.force("charge")
        .strength(chargeStrength * chargeEnabled)
        .distanceMin(distanceMin)
        .distanceMax(distanceMax);

    const { strength: collideStrength, enabled: collideEnabled, radius, iterations: collideIterations } = forceProperties.collide;
    selectionSimulation.force("collide")
        .strength(collideStrength * collideEnabled)
        .radius(radius)
        .iterations(collideIterations);
    selectionSimulation.force("forceX")
        .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
        .x(width * forceProperties.forceX.x);
    selectionSimulation.force("forceY")
        .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
        .y(height * forceProperties.forceY.y);

    const { enabled: linksEnabled, distance, iterations: linkIterations } = forceProperties.link;
    selectionSimulation.force("link")
        .id(function (d) { return d.id; })
        .distance(distance * 5)
        .iterations(linkIterations)
        .links(linksEnabled ? selectionGraph.links : []);
    

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    selectionSimulation.alpha(1).restart();

    
}

/******************************************END SELECTION SIMULATION ***********************************************/

/////////////////////////////////////////GRAPH NODE AND LINK POSITION///////////////////////////////////////////////////
const ticked = function () {
    nodeGroups.attr("transform", positionNode);
    link.attr("d", positionLink);
    
}

const simulationEnd = function () {
    //if (Date.now() < endTime) {
    nodeGroups.attr("transform", positionNode);
    link.attr("d", positionLink);
    /*link.attr('x1', function (d) { return d.source.x })
        .attr('y1', function (d) { return d.source.y })
        .attr('x2', function (d) { return d.target.x })
        .attr('y2', function (d) { return d.target.y });*/

    //node.attr("transform", positionNode);
    
    //return;
    //}

    //const rootSvgSize = svg.node().getBoundingClientRect();
    //const gDrawSize = gDraw.node().getBoundingClientRect();
    //const x = (rootSvgSize.x - gDrawSize.x) + (rootSvgSize.width - gDrawSize.width) / 2;
    //const y = (rootSvgSize.y - gDrawSize.y) +(rootSvgSize.height - gDrawSize.height) / 2;

    //gDraw.attr("transform", "translate(" + x + "," + y + ")");
    node.each(function (d) {
        d.fx = d.x;
        d.fy = d.y;
    });

    currentGraph.stopSimulation();
}

const startSimulation = function () {
    node.each(function (d) {
        d.x = d.y = 0;
        d.fx = d.fy = null;
    });

    currentGraph.resetSimulation();
}

const toggleSimulationTick = function (isChecked) {
    if (isChecked) {
        currentGraph.updateSimulationTick(ticked);
        return;
    }
    currentGraph.updateSimulationTick(null);
    return;

}

const positionLink = function(d) {
    const offset = 20;

    const { x: sourceX, y: sourceY } = d.source;
    const { x: targetX, y: targetY } = d.target;

    let x1 = sourceX,
        y1 = sourceY,
        x2 = targetX,
        y2 = targetY;

    const midpoint_x = (x1 + x2) / 2;
    const midpoint_y = (y1 + y2) / 2;

    const dx = (x2 - x1);
    const dy = (y2 - y1);

    const normalise = Math.sqrt((dx * dx) + (dy * dy));


    // Self edge.
    if (x1 === x2 && y1 === y2) {
        // Fiddle with this angle to get loop oriented.
        const xRotation = -45;

        // Needs to be 1.
        const largeArc = 1;

        const sweep = 1; // 1 or 0

        // Change sweep to change orientation of loop. 
        //sweep = 0;

        // Make drx and dry different to get an ellipse
        // instead of a circle.
        const drx = 10;
        const dry = 10;

        // For whatever reason the arc collapses to a point if the beginning
        // and ending points of the arc are the same, so kludge it.
        x2 = x2 + 1;
        y2 = y2 + 1;

        return "M" + sourceX + "," + sourceY + "A" + drx + "," + dry + " " + xRotation + "," + largeArc + "," + sweep + " " + x2 + "," + y2;
    }

    //var offSetX = midpoint_x + offset * (dy / normalise);
    //var offSetY = midpoint_y - offset * (dx / normalise);

    const offSetX = midpoint_x;
    const offSetY = midpoint_y;

    return "M" + sourceX + "," + sourceY +
        //"S" + offSetX + "," + offSetY +
        " " + targetX + "," + targetY;
}

//Update node position when simulation starts
const positionNode = function (d) {
    //d.select(this.parentNode).attr("transform", positionNode);
    return "translate(" + d.x + "," + d.y + ")";
}

const resetLayout = function () {
    d3.select("#reset-layout-btn")
        .style("color", null)
        .style("border-color", null);
    startSimulation()
}

/****************************************END GRAPH NODE AND LINK POSITION******************************************/

/////////////////////////////////////////SELECTION GRAPH NODE AND LINK POSITION///////////////////////////////////////////////////

//Update node or link position when simulation starts
const selectionTicked = function() {
    selectionNode.attr("transform", positionNode);
    selectionLink.attr("d", positionLink);
}

/****************************************END SELECTION GRAPH NODE AND LINK POSITION******************************************/



/////////////////////////////////////////////// NODE UPDATES////////////////////////////////////////////////


const updateNodes = function () {
    
    
    nodeGroups = nodeGroups.data(currentGraph.nodes);
    //	EXIT
    nodeGroups.exit().remove();
    
    

    const newNodeGroups = nodeGroups.enter()
        .append("g")
        .attr("class", "node-group")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    const newNode = newNodeGroups.append("circle")
        .attr("r", currentGraph.getForcePropertyValue(Graph.forceNames.collide, "radius"))
        .style("fill", "white")
        .on("mouseover", nodeMouseOver(.2))
        .on("mouseout", mouseOut);

    const newNodeText = newNodeGroups.append("text")
        .text(function (d) {
            return d.id;
        })
        .attr("id", function (d) {
            return d.id + '_node_text';
        })
        .attr("text-anchor", "middle")
        .on("mouseover", nodeMouseOver(.2))
        .on("mouseout", mouseOut);

    
    nodeGroups = nodeGroups.merge(newNodeGroups);
    node = nodeGroups.select("circle");
    nodeText = nodeGroups.select("text");

    currentGraph.updateSimulationNodes();
}

const updateLinks = function () {
    link = link.data(currentGraph.links, function (d) { d.source });
    link.exit().remove();

    const newLink = link.enter().append("path")

    link = link.merge(newLink);

    currentGraph.updateLinkForce();
}


//Update nodes and links after filtration
const updateNodesAndLinks = function() {
    updateNodes();
    updateLinks();

    const sizingSelect = document.getElementById('attribute-node-sizing');
    setAttributeNodeSizing(sizingSelect);

    const labelSelect = document.getElementById('node-label-select');
    setNodeLabel(labelSelect);
}



/****************************************END NODE UPDATES******************************************/

//////////////////////////////////////////SELECTION NODE UPDATES//////////////////////////////////////////
//Update nodes and links after filtration
const updateSelectionNodesAndLinks = function () {
    const { nodes, links } = selectionGraph
    selectionNode = selectionNode.data(nodes, function (d) { return d.id; });
    //	EXIT
    selectionNode.exit().remove();

    const newNode = selectionNode.enter().append("circle")
        .style("fill", function (d) {  
             return groupColours(d.id);
        })
        .attr("r", function (d) {
            return Math.sqrt(d.nonodes);
        })
        .attr("id", function (d) {
            return "selection_node_" + d.id;
        })
        /*.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("click", displayNodeProperties);*/

    newNode.append("title")
        .text(function (d) {
            return "Number of Nodes: " + d.nonodes;
        });

    selectionNode = selectionNode.merge(newNode);

    selectionLink = selectionLink.data(links, function (d) { d.source });
    //	EXIT
    selectionLink.exit().remove();

    const newLink = selectionLink.enter().append("path")
        .attr("id", function (l) {
            const { source, target } = l;
            return "selection_link_" + source + "-" + target;
        });

    newLink.append("title")
        .text(function (l) {
            return l.value;
        });

    selectionLink = selectionLink.merge(newLink);

    selectionSimulation
        .nodes(nodes)
        .on("tick", selectionTicked);

    selectionSimulation.force("link")
        .links(links);

    selectionSimulation.alpha(1).restart();
}

/****************************************END SELECTION NODE UPDATES******************************************/

/////////////////////////////////////////METRICS//////////////////////////////////////////////////////

const getGraphProperty = function (graph, metricDiv)
{
    const metricDivSpan = metricDiv.querySelector('span');
    const functionName = metricDiv.getAttribute('data-value');
    metricDivSpan.innerHTML = "Calculating...";
    const result = eval(functionName);
    metricDivSpan.innerHTML = result;
}

const calculateMetricAsync = function (current_graph, metricDiv) {
    const metricDivSpan = metricDiv.querySelector('span');
    metricDivSpan.innerHTML = "Calculating...";

    const workerName = metricDiv.getAttribute('data-value');
    const worker = new Worker(jsPath + workerName + '_worker.js?v=5');
    const data = {
        'graph': currentGraph.graph
    };
    worker.postMessage(data);

    worker.onmessage = e => {
        metricDivSpan.innerHTML = e.data.average.toFixed(3);
        currentGraph.setProperties(workerName, e.data);
        const nodeDetailElement = document.getElementById('node-detail-container')
        const nodeId = nodeDetailElement.getAttribute('data-id');
        const metricDisplayElement = nodeDetailElement.querySelector('#display-' + workerName);
        if (metricDisplayElement !== null && nodeId != null) {
            metricDisplayElement.value = currentGraph.getPropertyValue(nodeId, workerName);

        }

    }
    
}

const calculateAllMetrics = function () {
    const syncMetricsDivs = document.querySelectorAll('.network-metric-sync-content');
    for (let metricDiv of syncMetricsDivs) {
        getGraphProperty(graph, metricDiv);
    }
    const asyncMetricsDivs = document.querySelectorAll('.network-metric-async-content');
    for (let metricDiv of asyncMetricsDivs) {
        calculateMetricAsync(graph, metricDiv);
    }
}

/****************************************END METRICS******************************************/

d3.select(window).on("resize", function () {
    width = svg.node().parentNode.getBoundingClientRect().width;
    height = svg.node().parentNode.getBoundingClientRect().height;
});



$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});


