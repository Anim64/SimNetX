var graph = null;
var store = null;
var filterNodeList = [];
var linkedByIndex = {};
var attributefilter = {};

var node = null;
var link = null;

var selectionGraph = null;
var selectionNode = null;
var selectionLink = null;
var selectionDraw = null;


var rect = null;
var gBrushHolder = null;
var gBrush = null;
var brushMode = false;
var brushing = false;
var brush = null;
var gDraw = null;
var gMain = null;
var grads = null;
var transformX = 0;
var transformY = 0;
var scaleK = 1;

const simulationDurationInMs = 60000; // 20 seconds

let startTime = Date.now();
let endTime = startTime + simulationDurationInMs;

const jsPath = '../js/PropertyWorkers/';

    

//var nodeColor = "#000000";

let width = d3.select("#networkGraph svg").node().parentNode.clientWidth;
let height = d3.select("#networkGraph svg").node().parentNode.clientHeight;


var svg = d3.select("#networkGraph svg")
    .attr('width', width)
    .attr('height', height)
var selectionSvg = null;

console.log(width);


var simulation = d3.forceSimulation()
    .force("link", d3.forceLink())
    .force("charge", d3.forceManyBody())
    .force("collide", d3.forceCollide())
    .force("center", d3.forceCenter())
    .force("forceX", d3.forceX())
    .force("forceY", d3.forceY())
    //.force("radial", d3.forceRadial());

var selectionSimulation = d3.forceSimulation()
    .force("link", d3.forceLink())
    .force("charge", d3.forceManyBody())
    .force("collide", d3.forceCollide())
    .force("center", d3.forceCenter())
    .force("forceX", d3.forceX())
    .force("forceY", d3.forceY())
    //.force("radial", d3.forceRadial());


var groupColours = d3.scaleOrdinal(d3.schemeCategory20);
//var groupColours = d3.scaleOrdinal(d3.interpolateSpectral);

var defaultColour = "#FFFFFF";

var xScale = d3.scaleLinear()
    .domain([0, width]).range([0, width]);
var yScale = d3.scaleLinear()
    .domain([0, height]).range([0, height]);

var selectedNode = null;
var shiftKey = null;


//Properties of force simulation
var forceProperties = {
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
        x: 0.5
    },

    forceY: {
        enabled: true,
        strength: 0.1,
        y: 0.5
    },

    link: {
        enabled: true,
        distance: 75,
        strength: 0.1,
        iterations: 1
    },


};


//Draw graph of the network
function drawNetwork(data) {

    graph = data;
    graph["properties"] = {};

    svg.selectAll('.g-main').remove();

    gMain = svg.append('g')
        .classed('g-main', true);


    //Edge arrow definition
    var defs = svg.append("defs");
    defs.append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
        .attr("class", "arrow")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");

    
    //Background rectangle
    rect = gMain.append('rect')
        .attr("class", "background")
        .attr("id", "network-background-rect")
        .attr('width', width)
        .attr('height', height)
        .style('fill', '#1A1A1A')

    gDraw = gMain.append('g');


    //Define zoom function
    var zoom = d3.zoom()
        .on('zoom', zoomed);
    

    gMain.call(zoom);

    gBrushHolder = gMain.append('g');

    /*gBrushHolder.append('rect')
        .attr('width', width)
        .attr('height', height)
        .style('fill', '#333333')*/

    


    //Create line or curves in SVG
    link = gDraw.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(graph.links)
        .enter().append("path")
        //.attr("marker-end", "url(#arrow)")
        
        


    link.append("title")
        .text(function (l) {
            return l.id;
        });


    //Create node circles in SVG
    node = gDraw.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("r", forceProperties.collide.radius)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("mouseover", nodeMouseOver(.2))
        .on("mouseout", mouseOut);
        
    
    node.append("title")
        .text(function (d) { return d.id; });

   
    graph.links.forEach(function (d) {
        linkedByIndex[d.source + "," + d.target] = 1;
    });

    
    brushMode = false;
    brushing = false;

    brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("start", brushstarted)
        .on("brush", brushed)
        .on("end", brushended);

    
    //Background event to deselect all nodes
    rect.on('click', deselectAllNodes);

    d3.select('body').on('keydown', keydown);
    d3.select('body').on('keyup', keyup);


    //Store graph for filtration
    store = $.extend(true, {}, data);

    //Add nodes to simulation
    simulation
        .nodes(graph.nodes)
        .on("tick", ticked)
        .on("end", simulationStop)
        //.on("end", redrawGradient);

    updateForces();
    
    node.style("fill", function (d) {
        return nodeColor(d.id);

    });

    link.style("stroke", function (l) {
        return nodeColor(l.source.id);

    });

}


//Draw selection graph
function drawSelectionNetwork(data) {
    selectionGraph = data;
    

    selectionSvg = d3.select("#selectionGraph svg")
        .attr('width', width)
        .attr('height', height);
    selectionSvg.selectAll('.g-main').remove();

    var selectionMain = selectionSvg.append('g')
        .classed('g-main', true);

    var defs = selectionMain.append("defs");

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
        .attr("d", "M0,-5L10,0L0,5");

    var zoom = d3.zoom()
        .on('zoom', selectionZoomed)

    selectionMain.call(zoom);


    //Background rectangle
    var selectionRect = selectionMain.append('rect')
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
        .attr("marker-end", "url(#selection_arrow)")
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
            setGroupColour(d);
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

//Update node or link position when simulation starts
function ticked() {
    link.attr("d", positionLink);
    node.attr("transform", positionNode);

}



function simulationStop() {
    simulation.stop();
}


//Update node or link position when simulation starts
function selectionTicked() {
    selectionLink.attr("d", positionLink);
    selectionNode.attr("transform", positionNode);
}

//Update link position when simulation starts
function positionLink(d) {
    var offset = 20;

    var x1 = d.source.x,
        y1 = d.source.y,
        x2 = d.target.x,
        y2 = d.target.y;

    link

    var midpoint_x = (x1 + x2) / 2;
    var midpoint_y = (y1 + y2) / 2;

    var dx = (x2 - x1);
    var dy = (y2 - y1);

    var normalise = Math.sqrt((dx * dx) + (dy * dy));

    
    // Self edge.
    if (x1 === x2 && y1 === y2) {
        // Fiddle with this angle to get loop oriented.
        var xRotation = -45;

        // Needs to be 1.
        var largeArc = 1;

        var sweep = 1; // 1 or 0

        // Change sweep to change orientation of loop. 
        //sweep = 0;

        // Make drx and dry different to get an ellipse
        // instead of a circle.
        var drx = 10;
        var dry = 10;

        // For whatever reason the arc collapses to a point if the beginning
        // and ending points of the arc are the same, so kludge it.
        x2 = x2 + 1;
        y2 = y2 + 1;

        return "M" + d.source.x + "," + d.source.y + "A" + drx + "," + dry + " " + xRotation + "," + largeArc + "," + sweep + " " + x2 + "," + y2;
    }

    //var offSetX = midpoint_x + offset * (dy / normalise);
    //var offSetY = midpoint_y - offset * (dx / normalise);

    var offSetX = midpoint_x;
    var offSetY = midpoint_y;

    return "M" + d.source.x + "," + d.source.y +
        //"S" + offSetX + "," + offSetY +
        " " + d.target.x + "," + d.target.y;
}

//Update node position when simulation starts
function positionNode(d) {
    return "translate(" + d.x + "," + d.y + ")";
}





//Function for node dragging start
function dragstarted(d) {
    toggleNodeDetails(d.id);
    if (!d3.event.active) simulation.alphaTarget(0.9).restart();

    if (!d.selected && !shiftKey) {
        // if this node isn't selected, then we have to unselect every other node
        node.classed("selected", function (p) { return p.selected = p.previouslySelected = false; });
    }

    d3.select(this).classed("selected", function (p) { d.previouslySelected = d.selected; return d.selected = true; });

    node.filter(function (d) { return d.selected; })
        .each(function (d) { //d.fixed |= 2; 
            d.fx = d.x;
            d.fy = d.y;
        })
}



// check the dictionary to see if nodes are linked
function isConnected(nodeId1, nodeId2) {
    return linkedByIndex[nodeId1 + "," + nodeId2] || linkedByIndex[nodeId2 + "," + nodeId1] || nodeId1 == nodeId2;
}

function fadeDisconnectedNodes(nodeId, opacity) {
    // check all other nodes to see if they're connected
    // to this one. if so, keep the opacity at 1, otherwise
    // fade
    node.attr("r", function (d) {
        return nodeId === d.id ? forceProperties.collide.radius * 2 : forceProperties.collide.radius;
    });
    node.style("stroke-opacity", function (o) {
        thisOpacity = isConnected(nodeId, o.id) ? 1 : opacity;
        return thisOpacity;
    });
    node.style("fill-opacity", function (o) {
        thisOpacity = isConnected(nodeId, o.id) ? 1 : opacity;
        return thisOpacity;
    });
    // also style link accordingly
    link.style("stroke-opacity", function (o) {
        return o.source.id === nodeId || o.target.id === nodeId ? 1 : opacity;
    });
    link.style("stroke", function (o) {
        return o.source.id === nodeId || o.target.id === nodeId ? o.source.colour : nodeColor(o.source.id);
    });
}
// fade nodes on hover
function nodeMouseOver(opacity) {
    return function (d) {
        fadeDisconnectedNodes(d.id, opacity);
    };
}

function mouseOut() {
    node.attr("r", forceProperties.collide.radius);
    node.style("stroke-opacity", 1);
    node.style("fill-opacity", 1);
    link.style("stroke-opacity", 1);
    link.style("stroke", function (d) {
        return nodeColor(d.source.id);
    });
}


//Function for node dragging
function dragged(d) {
    //d.fx = d3v4.event.x;
    //d.fy = d3v4.event.y;
    node.filter(function (d) { return d.selected; })
        .each(function (d) {
            d.fx += d3.event.dx;
            d.fy += d3.event.dy;
        })
}


//Function for node dragging end
function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
    node.filter(function (d) { return d.selected; })
        .each(function (d) { //d.fixed &= ~6; 
            d.fx = null;
            d.fy = null;
        })
}


//Function for node brushing start
function brushstarted() {
    // keep track of whether we're actively brushing so that we
    // don't remove the brush on keyup in the middle of a selection
    brushing = true;

    node.each(function (d) {
        d.previouslySelected = shiftKey && d.selected;
    });
}

//Function for node brushing
function brushed() {
    if (!d3.event.sourceEvent) return;
    if (!d3.event.selection) return;

    var extent = d3.event.selection;
    
    node.classed("selected", function (d) {
        d.selected = d.previouslySelected |
            (extent[0][0] <= ((d.x * scaleK) + transformX) && ((d.x * scaleK) + transformX) < extent[1][0]
                && extent[0][1] <= ((d.y * scaleK) + transformY) && ((d.y * scaleK) + transformY) < extent[1][1]);
        if (d.selected) {
            document.querySelector('#heading-' + d.id).classList.add('node-heading-selected');
        }
        return d.selected
    });
}

//Function for node brushing end
function brushended() {
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

function deselectAllNodes() {
    node.each(function (d) {
        d.selected = false;
        d.previouslySelected = false;
    });
    node.classed("selected", false);
    document.querySelectorAll('.node-heading-selected').forEach(nodeHeading => {
        nodeHeading.classList.remove("node-heading-selected");
    });
}


//Calculate zoom
function zoomed() {
    
    var transform = d3.event.transform;
    transformX = transform.x;
    transformY = transform.y;
    scaleK = transform.k;
    gDraw.attr("transform", "translate(" + transformX + "," + transformY + ") scale(" + scaleK + ")");
}


//Calculate zoom

function selectionZoomed() {
    selectionDraw.attr("transform", d3.event.transform);
}

//On shift key event
function keydown() {
    shiftKey = d3.event.shiftKey;

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
function keyup() {
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



function displayNodeProperties(d) {
    console.log(d.id);
    $("#btn_node_" + d.id).removeClass("collapsed");
        
    
}

function resetSelection() {
    selectedNode.style("stroke", "black");
    selectedNode = null;
}

//Update graph simulation forces
function updateForces() {
    simulation.force("center")
        .x(width * forceProperties.center.x)
        .y(height * forceProperties.center.y);
    simulation.force("charge")
        .strength(forceProperties.charge.strength * forceProperties.charge.enabled)
        .distanceMin(forceProperties.charge.distanceMin)
        .distanceMax(forceProperties.charge.distanceMax);
    simulation.force("collide")
        .strength(forceProperties.collide.strength * forceProperties.collide.enabled)
        .radius(forceProperties.collide.radius)
        .iterations(forceProperties.collide.iterations);
    /*simulation.force("forceX")
        .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
        .x(width * forceProperties.forceX.x);
    simulation.force("forceY")
        .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
        .y(height * forceProperties.forceY.y);*/
    simulation.force("link")
        .id(function (d) { return d.id; })
        .links(forceProperties.link.enabled ? graph.links : [])
        .distance(function (l) {
            if (graph.partitions[l.source.id] === graph.partitions[l.target.id]) {
                return forceProperties.link.distance;
            }
            else {
                return forceProperties.link.distance * 4;
            }
        })
        .iterations(forceProperties.link.iterations);
    
   
    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    simulation.alpha(1).restart();
}


//Update selection graph simulation forces
function updateSelectionForces() {
    selectionSimulation.force("center")
        .x(width * forceProperties.center.x)
        .y(height * forceProperties.center.y);
    selectionSimulation.force("charge")
        .strength(forceProperties.charge.strength * forceProperties.charge.enabled)
        .distanceMin(forceProperties.charge.distanceMin)
        .distanceMax(forceProperties.charge.distanceMax);
    selectionSimulation.force("collide")
        .strength(forceProperties.collide.strength * forceProperties.collide.enabled)
        .radius(forceProperties.collide.radius)
        .iterations(forceProperties.collide.iterations);
    selectionSimulation.force("forceX")
        .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
        .x(width * forceProperties.forceX.x);
    selectionSimulation.force("forceY")
        .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
        .y(height * forceProperties.forceY.y);
    selectionSimulation.force("link")
        .id(function (d) { return d.id; })
        .distance(forceProperties.link.distance * 5)
        .iterations(forceProperties.link.iterations)
        .links(forceProperties.link.enabled ? selectionGraph.links : []);
    

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    selectionSimulation.alpha(1).restart();
}





//Update node colors
function updateNodeGroups() {
    /*node.style("fill", function (d) {
        document.getElementById("panel_" + d.id).style.borderColor = groupColours(graph.partitions[d.id]);
        if (graph.partitions[d.id] != "") {

            return groupColours(graph.partitions[d.id]);

        }
        else {
            return defaultColour;
        }
    })*/
    
}

function updateNodes() {
    node = node.data(graph.nodes, function (d) { return d.id; });
    //	EXIT
    node.exit().remove();

    var newNode = node.enter().append("circle")
        .attr("r", forceProperties.collide.radius)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("click", displayNodeProperties);

    newNode.append("title")
        .text(function (d) { return d.id; });

    node = node.merge(newNode);

    node.style("fill", function (d) {
        return nodeColor(d.id);

    })

    link.style("stroke", function (l) {
        return nodeColor(l.source.id);

    })

    updateNodeGroups();
}

function updateLinks() {
    link = link.data(graph.links, function (d) { d.source });
    //	EXIT
    link.exit().remove();

    var newLink = link.enter().append("path")
        .attr("marker-end", "url(#arrow)")


    link = link.merge(newLink);

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked)
        .on("end", simulationStop);

    simulation.force("link")
        .links(graph.links);

    simulation.alpha(1).restart();

    link.style("stroke", function (l) {
        return nodeColor(l.source.id);
    });
}


//Update nodes and links after filtration
function updateNodesAndLinks() {
    updateNodes();
    updateLinks();
}

//Update nodes and links after filtration
function updateSelectionNodesAndLinks() {
    selectionNode = selectionNode.data(selectionGraph.nodes, function (d) { return d.id; });
    //	EXIT
    selectionNode.exit().remove();

    var newNode = selectionNode.enter().append("circle")
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

    selectionLink = selectionLink.data(selectionGraph.links, function (d) { d.source });
    //	EXIT
    selectionLink.exit().remove();

    var newLink = selectionLink.enter().append("path")
        .attr("marker-end", "url(#selection_arrow)")
        .attr("id", function (l) {
            return "selection_link_" + l.source + "-" + l.target;
        });

    newLink.append("title")
        .text(function (l) {
            return l.value;
        });

    selectionLink = selectionLink.merge(newLink);

    selectionSimulation
        .nodes(selectionGraph.nodes)
        .on("tick", selectionTicked);

    selectionSimulation.force("link")
        .links(selectionGraph.links);

    selectionSimulation.alpha(1).restart();
}

function updateDisplay() {
    node
        .attr("r", forceProperties.collide.radius)
        //.style("stroke", forceProperties.charge.strength > 0 ? "blue" : "red")
        //.style("stroke-width", forceProperties.charge.enabled == false ? 0 : Math.abs(forceProperties.charge.strength) / 15);

    link
        .style("stroke-width", forceProperties.link.enabled ? 1 : .5)
        .style("opacity", forceProperties.link.enabled ? 1 : 0);
}

function updateAll() {
    updateForces();
    updateDisplay();
}

function nodeColor(nodeId) {


    if (graph.partitions[nodeId] != "") {

        return document.getElementById("selection_color_" + graph.partitions[nodeId]).value;

    }
    else {
        return defaultColour;
    }
}

function calculateMetric(current_graph, metricDiv) {
    metricDiv.querySelector('span').innerHTML = "Calculating...";

    const workerName = metricDiv.getAttribute('data-value');
    const worker = new Worker(jsPath + workerName + '_worker.js?v=2');
    const data = {
        'graph': current_graph,
        'linksDict': linkedByIndex
    };
    worker.postMessage(data);

    worker.onmessage = e => {
        metricDiv.querySelector('span').innerHTML = e.data.average.toFixed(3);
        graph.properties[workerName] = e.data;
    }
    
}

function getNodeCount(graph) {
    return graph.nodes.length;
}



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

    node.on("click", displayNodeProperties);

    var metricsDivs = document.querySelectorAll('.network-metric-content');
    Array.prototype.forEach.call(metricsDivs, function (metricDiv) {
        calculateMetric(graph, metricDiv);
    });
});

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});


