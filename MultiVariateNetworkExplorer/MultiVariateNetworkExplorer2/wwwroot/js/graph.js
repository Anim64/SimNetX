let graph = null;
let store = null;
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

   

let width = d3.select("#networkGraph svg").node().parentNode.clientWidth;
let height = d3.select("#networkGraph svg").node().parentNode.clientHeight;


let svg = d3.select("#networkGraph svg")
    .attr('width', width)
    .attr('height', height)
let selectionSvg = null;

let simulation = d3.forceSimulation()
    .force("link", d3.forceLink())
    .force("charge", d3.forceManyBody())
    .force("collide", d3.forceCollide())
    .force("center", d3.forceCenter())
    .force("forceX", d3.forceX())
    .force("forceY", d3.forceY())
    //.force("radial", d3.forceRadial());

let selectionSimulation = d3.forceSimulation()
    .force("link", d3.forceLink())
    .force("charge", d3.forceManyBody())
    .force("collide", d3.forceCollide())
    .force("center", d3.forceCenter())
    .force("forceX", d3.forceX())
    .force("forceY", d3.forceY())
    //.force("radial", d3.forceRadial());


let groupColours = d3.scaleOrdinal(d3.schemeCategory20);
//let groupColours = d3.scaleOrdinal(d3.interpolateSpectral);

let xScale = d3.scaleLinear()
    .domain([0, width]).range([0, width]);
let yScale = d3.scaleLinear()
    .domain([0, height]).range([0, height]);

let selectedNode = null;
let shiftKey = null;


//Properties of force simulation
let forceProperties = {
    center: {
        x: 0.5,
        y: 0.5
    },

    charge: {
        enabled: true,
        strength: -80,
        distanceMin: 1,
        distanceMax: 2000
    },

    collide: {
        enabled: true,
        strength: 0.7,
        radius: 8,
        iterations: 1
    },

    forceX: {
        enabled: true,
        strength: 0.1,
        x: 0.5,
        attribute: ""
    },

    forceY: {
        enabled: true,
        strength: 0.1,
        y: 0.5,
        attribute: ""
    },

    link: {
        enabled: true,
        distance: 75,
        iterations: 1
    },
    sizing: {
        enabled: false,
        attribute: ""
    },
    colouring: {
        network: "#FFFFFF",
        background: "#000000"
    },

    attributeColouring: {
        enabled: false,
        attribute: "",
        lowValue: "#0000FF",
        highValue: "#FF0000"
    },
    labels: {
        enabled: true,
        attribute: "id"
    }
};

const updateGraphStore = function (graph) {
    store = $.extend(true, {}, graph);
}


const prepareLinks = function() {
    //Create line or curves in SVG
    const { links } = graph;
    link = gDraw.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(links)
        .enter().append("path")
        .style("display", "none");

    link.append("title")
        .text(function (l) {
            return l.id;
        });


    for (let l of graph.links) {
        const { source, target } = l;
        const index = source + "," + target
        linkedByIndex[index] = 1;
    }

}

const prepareNodes = function () {
    //Create node circles in SVG
    const { nodes } = graph;
    const { radius } = forceProperties.collide;

    gNodes = gDraw.append("g")
        .attr("class", "nodes")
        .attr("id", "nodes")
        .selectAll("circle")
        .data(nodes);

    nodeGroups = gNodes.enter()
        .append("g")
        .attr("class", "node-group")
        .style("display", "none")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node = nodeGroups.append("circle")
        .attr("r", radius)
        .on("mouseover", nodeMouseOver(.2))
        .on("mouseout", mouseOut);




    //Add nodes to simulation
    simulation
        .nodes(nodes)
        //.on("tick", ticked)
        .on("end", simulationEnd);
        

    
        
}


const prepareText = function () {
    nodeText = nodeGroups.append("text")
        .text(function (d) { return d.id; })
        .attr("id", function (d) { return d.id + '_node_text'; })
        .attr("text-anchor", "middle")
        .on("mouseover", nodeMouseOver(.2))
        .on("mouseout", mouseOut);
    setNodeFontSize(forceProperties.collide.radius);
        
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
        .attr('width', width)
        .attr('height', height)
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
const drawNetwork = function(data) {
    graph = data;
    graph.properties = {};

    prepareLinks();
    prepareNodes();
    prepareText();
}

const initGraph = function (data) {
    prepareCanvas();
    drawNetwork(data);
    updateGraphStore(graph);
    updateForces();
    updateNodeAndLinkColour(node, link);
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
            return forceProperties.collide.radius + Math.sqrt(d.nonodes);
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
const isConnected = function(nodeId1, nodeId2) {
    return linkedByIndex[nodeId1 + "," + nodeId2] || linkedByIndex[nodeId2 + "," + nodeId1] || nodeId1 === nodeId2;
}

const fadeDisconnectedNodes = function(nodeId, opacity) {
    // check all other nodes to see if they're connected
    // to this one. if so, keep the opacity at 1, otherwise
    // fade

    
    node.attr("r", function (d) {
        return nodeId === d.id ? d.r * 2 : d.r;
    });

    node.style("stroke-opacity", function (o) {
        thisOpacity = isConnected(nodeId, o.id) ? 1 : opacity;
        return this.Opacity;
    });
    node.style("fill-opacity", function (o) {
        thisOpacity = isConnected(nodeId, o.id) ? 1 : opacity;
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
    closeNodeDetails("node-detail-container");
    if (!d3.event.active)
        //resetSimulation();
    
    if (!d.selected && !shiftKey) {
        // if this node isn't selected, then we have to unselect every other node
        nodeGroups.classed("selected", function (p) { return p.selected = p.previouslySelected = false; });
    }

    d3.select(this).classed("selected", true);
    d.previouslySelected = d.selected;
    d.selected = true;

    node.each(function (d) {
            //d.fixed |= 2;
            d.fx = d.x;
            d.fy = d.y;
        });
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
    //node.filter(function (d) { return d.selected; })
    //    .each(function (d) {
    //        d.x += dx;
    //        d.y += dy;
    //        d.fx += dx;
    //        d.fy += dy;
    //    })
    ticked();
    
}



//Function for node dragging end
const dragended = function(d) {
    if (!d3.event.active) simulation.alphaTarget(0);

    toggleNodeDetails(d.id, d.index);
    //node.filter(function (d) { return d.selected; })
    //    .each(function (d) {
    //        d.fx = null;
    //        d.fy = null;
    //    })
    
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
        if (d.selected) {
            document.querySelector('#heading-' + d.id).classList.add('node-heading-selected');
        }
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
}

//On shift key event
const keydown = function() {
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
    node.each(function (d) {
        d.selected = false;
        d.previouslySelected = false;
    });
    nodeGroups.classed("selected", function (d) {
        return d.selected = d.previouslySelected = false;
    });
    document.querySelectorAll('.node-heading-selected').forEach(nodeHeading => {
        nodeHeading.classList.remove("node-heading-selected");
    });
}

/************************************************END BRUSHING **********************************************/

///////////////////////////////////////////////ZOOM/////////////////////////////////////////////////
//Calculate zoom
const zoomed = function() {
    
    const {x, y, k} = d3.event.transform;
    transformX = x;
    transformY = y;
    scaleK = k;
    gDraw.attr("transform", "translate(" + transformX + "," + transformY + ") scale(" + scaleK + ")");
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
    
    /*simulation.force("forceX")
        .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
        .x(width * forceProperties.forceX.x);
    simulation.force("forceY")
        .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
        .y(height * forceProperties.forceY.y);*/

    
    node.each(function (d) {
        d.fx = null;
        d.fy = null;
    });
   
    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    if (reset) {
        resetSimulation();
    }
}

const updateCenterForce = function () {
    const { x, y } = forceProperties.center;
    simulation.force("center")
        .x(width * x)
        .y(height * y);
}

const updateChargeForce = function () {
    const { strength: chargeStrength, enabled: chargeEnabled, distanceMin, distanceMax } = forceProperties.charge;
    simulation.force("charge")
        .strength(chargeStrength * chargeEnabled)
        .distanceMin(distanceMin)
        .distanceMax(distanceMax);
}

const updateCollideForce = function () {
    const { strength: collideStrength, enabled: collideEnabled, radius, iterations: collideIterations } = forceProperties.collide;
    simulation.force("collide")
        .strength(collideStrength * collideEnabled)
        .radius(radius)
        .iterations(collideIterations);

    if (forceProperties.sizing.enabled) {
        node.attr("r", function (d) {
            const { previousRadius } = forceProperties.collide;
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
    const { enabled: linksEnabled, distance, iterations: linkIterations } = forceProperties.link;
    const chosenLinks = linksEnabled ? graph.links : [];
    simulation.force("link")
        .id(function (d) { return d.id; })
        .distance(function (l) {
            if (graph.partitions[l.source.id] === graph.partitions[l.target.id]) {
                return distance;
            }
            else {
                return distance * 4;
            }
        })
        .iterations(linkIterations)
        .links(chosenLinks);
        //linksEnabled ? graph.links : []
    link
        .attr("stroke-width", forceProperties.link.enabled ? 1 : .5)
        .attr("opacity", forceProperties.link.enabled ? 1 : 0);
}

const resetSimulation = function() {
    startTime = Date.now();
    endTime = startTime + simulationDurationInMs;
    //simulation.start();
    simulation.alpha(1).restart();
}

/******************************************END GRAPH SIMULATION ***********************************************/


///////////////////////////////////////// SELECTION SIMULATION ///////////////////////////////////////////////


//Update selection graph simulation forces
const updateSelectionForces = function () {

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
    link.attr("d", positionLink);
    /*link.attr('x1', function (d) { return d.source.x })
        .attr('y1', function (d) { return d.source.y })
        .attr('x2', function (d) { return d.target.x })
        .attr('y2', function (d) { return d.target.y });*/

    //node.attr("transform", positionNode);
    nodeGroups.attr("transform", positionNode);
    //return;
    //}
    link.style("display", "block");
    nodeGroups.style("display", "block");

    simulation.stop();
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

/****************************************END GRAPH NODE AND LINK POSITION******************************************/

/////////////////////////////////////////SELECTION GRAPH NODE AND LINK POSITION///////////////////////////////////////////////////

//Update node or link position when simulation starts
const selectionTicked = function() {
    if (Date.now() < endTime) {
        selectionNode.attr("transform", positionNode);
        selectionLink.attr("d", positionLink);
    }
    else {
        selectionSimulation.stop();
    }
}

/****************************************END SELECTION GRAPH NODE AND LINK POSITION******************************************/



/////////////////////////////////////////////// NODE UPDATES////////////////////////////////////////////////
const updateNodeColour = function (nodes) {
    nodes.style("fill", function (d) {
        const { id } = d;
        const colour = getNodeColour(id);
        const lightness = fontLightness(colour);
        const nodeHeading = $('#heading-' + id);
        const text = $('#' + id + '_node_text');
        nodeHeading.css("backgroundColor", colour);
        nodeHeading.css("color", 'hsl(0, 0%, ' + String(lightness) + '%)');
        text.css("fill", 'hsl(0, 0%, ' + String(lightness) + '%)')
        return colour;
    });
}

const updateLinkColour = function(links) {
    links.style("stroke", function (l) {
        const { id } = l.source;
        return getNodeColour(id);
    })
}

const updateHeadingColour = function (nodes) {
    for (const d of nodes) {
        const { id } = d;
        const colour = getNodeColour(id);
        const lightness = fontLightness(colour);
        const nodeHeading = $('#heading-' + id);
        nodeHeading.css("backgroundColor", colour);
        nodeHeading.css("color", 'hsl(0, 0%, ' + String(lightness) + '%)');
    };
}

const getNodeColour = function (nodeId) {
    const { partitions } = graph;
    if (partitions[nodeId] !== "") {

        const colour_input_name = "selection_color_" + partitions[nodeId];
        const colour_input = document.getElementById(colour_input_name)
        return colour_input.value;
        //return groupColours(graph.partitions[nodeId]);

    }
    else {
        return forceProperties.colouring.network;
    }
}



const updateNodes = function () {
    
    const { nodes } = graph;
    nodeGroups = nodeGroups.data(nodes);
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
        .attr("r", forceProperties.collide.radius)
        .on("mouseover", nodeMouseOver(.2))
        .on("mouseout", mouseOut);

    const newNodeText = newNodeGroups.append("text")
        .attr("id", function (d) { return d.id + '_node_text'; })
        .attr("text-anchor", "middle")
        .on("mouseover", nodeMouseOver(.2))
        .on("mouseout", mouseOut);


    nodeGroups = nodeGroups.merge(newNodeGroups);
    node = nodeGroups.selectAll("circle");
    nodeText = nodeGroups.selectAll("text");
    simulation
        .nodes(nodes)
        .on("tick", ticked);
        //.on("end", simulationEnd);
}

const updateLinks = function () {
    const { links } = graph;
    link = link.data(links, function (d) { d.source });
    link.exit().remove();

    const newLink = link.enter().append("path")

    link = link.merge(newLink);

    simulation.force("link")
        .links(links);
}


//Update nodes and links after filtration
const updateNodesAndLinks = function() {
    updateNodes();
    updateLinks();
    //resetSimulation();

    const sizingSelect = document.getElementById('attribute-node-sizing');
    setAttributeNodeSizing(sizingSelect);

    const colouringSelect = document.getElementById('attribute-node-colouring');
    setAttributeNodeColouring(colouringSelect);

    const labelSelect = document.getElementById('node-label-select');
    setNodeLabel(labelSelect);
}

const updateNodeAndLinkColour = function(nodes, links) {
    updateNodeColour(nodes);
    updateLinkColour(links);
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


const getNodeCount = function (graph) {
    return graph.nodes.length;
}

const getLinkCount = function (graph) {
    return graph.links.length;
}

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
        'graph': current_graph,
        'linksDict': linkedByIndex
    };
    worker.postMessage(data);

    worker.onmessage = e => {
        const { properties } = graph;
        metricDivSpan.innerHTML = e.data.average.toFixed(3);
        properties[workerName] = e.data;
        const nodeDetailElement = document.getElementById('node-detail-container')
        const nodeId = nodeDetailElement.getAttribute('data-id');
        nodeDetailElement.querySelector('#display-' + workerName).value = properties[workerName].values[nodeId];

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
    width = +svg.node().getBoundingClientRect().width;
    height = +svg.node().getBoundingClientRect().height;
    updateForces();
    updateSelectionForces();
});

$(document).ready(function () {
    $('.collapse.in').prev('.panel-heading').addClass('active');
    $('#accordion')
        .on('show.bs.collapse', function (a) {
            $(a.target).prev('.panel-heading').addClass('active');
        })
        .on('hide.bs.collapse', function (a) {
            $(a.target).prev('.panel-heading').removeClass('active');
        });

    document.addEventListener('click', closeAllToolbarPanels);
    document.addEventListener('click', closeAllRemodelPanels);

    prepareInputForm();
    calculateAllMetrics();
    

    selectionNode.each(function (d) {
        setGroupColour(d);
    });

    displayAlgorithmParameters("remodel-algorithm-select");
    displayMetricParameters("remodel-metric-select");

});

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});


