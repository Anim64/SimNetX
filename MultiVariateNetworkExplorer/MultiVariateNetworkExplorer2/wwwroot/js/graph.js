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

const simulationDurationInMs = 60000; // 20 seconds

let startTime = Date.now();
let endTime = startTime + simulationDurationInMs;



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



var forceProperties = {
    center: {
        x: 0.5,
        y: 0.5
    },

    charge: {
        enabled: false,
        strength: -80,
        distanceMin: 1,
        distanceMax: 2000
    },

    collide: {
        enabled: true,
        strength: 0.7,
        radius: 4,
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
        enabled: false,
        distance: 75,
        strength: 0.1,
        iterations: 1
    },


};

function drawNetwork(data) {

    graph = data;

    svg.selectAll('.g-main').remove();

    gMain = svg.append('g')
        .classed('g-main', true);

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

    

    rect = gMain.append('rect')
        .attr("class", "background")
        .attr('width', width)
        .attr('height', height)
        .style('fill', '#333333')

    gDraw = gMain.append('g');

    var zoom = d3.zoom()
        .on('zoom', zoomed);
    

    gMain.call(zoom);

    gBrushHolder = gDraw.append('g');
    

    link = gDraw.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(graph.links)
        .enter().append("path")
        .attr("marker-end", "url(#arrow)")
        .style("stroke", function (l) {
            return nodeColor(l.source);
        });


    link.append("title")
        .text(function (l) {
            return l.id;
        });

    

    
    graph.links.forEach(function (d) {
        linkedByIndex[d.source + "," + d.target] = 1;
    });
    
    node = gDraw.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .style("fill", function (d) {
            return nodeColor(d);

        })
        .attr("r", forceProperties.collide.radius)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        //.on("click", displayNodeProperties)
        .on("mouseover", mouseOver(.2))
        .on("mouseout", mouseOut);

        

    
    node.append("title")
        .text(function (d) { return d.id; });


    

    brushMode = false;
    brushing = false;

    brush = d3.brush()
        .on("start", brushstarted)
        .on("brush", brushed)
        .on("end", brushended);

    

    rect.on('click', () => {
        node.each(function (d) {
            d.selected = false;
            d.previouslySelected = false;
        });
        node.classed("selected", false);
    });

    d3.select('body').on('keydown', keydown);
    d3.select('body').on('keyup', keyup);

    store = $.extend(true, {}, data);

    startTime = Date.now();
    endTime = startTime + simulationDurationInMs;
    simulation
        .nodes(graph.nodes)
        .on("tick", ticked)
        .on("end", simulationStop)
        //.on("end", redrawGradient);

    updateForces();
    /*simulation.force("link")
        .links(graph.links);*/


    /*grads = defs.selectAll("linearGradient")
        .data(graph.links, getGradID)
        .enter().append("linearGradient")
        .attr("id", getGradID)
        .attr("gradientUnits", "userSpaceOnUse");
        
        

    /*grads.html("") //erase any existing <stop> elements on update
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", function (d) {
            return nodeColor((d.source.x <= d.target.x) ?
                d.source : d.target);
        });*/

    /*grads.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", function (d) {
            return nodeColor((+d.source.x <= +d.target.x) ?
                d.source : d.target);
        })

    grads.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", function (d) {
            return nodeColor((+d.source.x > +d.target.x) ?
                d.source : d.target);
        });*/

   

}

function drawSelectionNetwork(data) {
    selectionGraph = data;
    

    selectionSvg = d3.select("#selectionGraph svg");
    selectionSvg.selectAll('.g-main').remove();

    var selectionMain = selectionSvg.append('g')
        .classed('g-main', true);

    var defs = selectionMain.append("defs");

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

    
    /*var grads = defs.selectAll("linearGradient")
        .data(selectionGraph.links, getGradID);

    grads.enter().append("linearGradient")
        .attr("id", getGradID)
        .attr("gradientUnits", "userSpaceOnUse");

    grads.html("") //erase any existing <stop> elements on update
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", function (d) {
            return nodeColor((+d.source.x <= +d.target.x) ?
                d.source : d.target);
        });

    grads.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", function (d) {
            return nodeColor((+d.source.x > +d.target.x) ?
                d.source : d.target)
        });*/

    var zoom = d3.zoom()
        .on('zoom', selectionZoomed)

    selectionMain.call(zoom);

    var selectionRect = selectionMain.append('rect')
        .attr('width', width)
        .attr('height', height)
        .style('fill', '#333333')

    selectionDraw = selectionMain.append('g');
    
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
    selectionSimulation.force("link")
        .links(selectionGraph.links);
}

function ticked() {
    /*link
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

    node
        .attr("cx", function (d) { return d.x = Math.max(forceProperties.collide.radius, Math.min(width - forceProperties.collide.radius, d.x)); })
        .attr("cy", function (d) { return d.y = Math.max(forceProperties.collide.radius, Math.min(height - forceProperties.collide.radius, d.y)); });*/
    /*if (Date.now() < endTime) {
        
    } else {
        simulation.stop();
    }*/

    link.attr("d", positionLink);
    node.attr("transform", positionNode);
    
    //positionGrads();

}



function simulationStop() {
    simulation.stop();
}

function selectionTicked() {
    selectionLink.attr("d", positionLink);
    selectionNode.attr("transform", positionNode);
}

function positionLink(d) {
    var offset = 20;

    var x1 = d.source.x,
        y1 = d.source.y,
        x2 = d.target.x,
        y2 = d.target.y;

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

    var offSetX = midpoint_x + offset * (dy / normalise);
    var offSetY = midpoint_y - offset * (dx / normalise);

    return "M" + d.source.x + "," + d.source.y +
        "S" + offSetX + "," + offSetY +
        " " + d.target.x + "," + d.target.y;
}

function positionNode(d) {
    return "translate(" + d.x + "," + d.y + ")";
}

/*function positionGrads() {
    grads.attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });
}

function getGradID(d) {
    return "linkGrad-" + d.source.id + "-" + d.target.id;
}*/


function nodeColor(d) {

    var nodeId = d.id ? d.id : d;
    if (graph.partitions[nodeId] != "") {

        return document.getElementById("selection_color_" + graph.partitions[nodeId]).value;

    }
    else {
        return defaultColour;
    }
    //return d.color = color(d.name.replace(/ .*/, ""));
}

function changeGroupColour(color, selectionId) {
    node.filter(function (n) { return graph.partitions[n.id] == selectionId })
        .style("fill", function (d) {
            link.filter(function (l) { return l.source == d.id || l.source.id == d.id })
                .style("stroke", color);
            return color;
        });
    
}

function setGroupColour(d) {
    document.getElementById("selection_color_" + d.id).value = groupColours(d.id);
}

function getGroupColour(d) {
    return document.getElementById("selection_color_" + d.id).value;
}

function dragstarted(d) {
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
function isConnected(a, b) {
    return linkedByIndex[a.id + "," + b.id] || linkedByIndex[b.id + "," + a.id] || a.id == b.id;
}

// fade nodes on hover
function mouseOver(opacity) {
    return function (d) {
        // check all other nodes to see if they're connected
        // to this one. if so, keep the opacity at 1, otherwise
        // fade
        node.style("stroke-opacity", function (o) {
            thisOpacity = isConnected(d, o) ? 1 : opacity;
            return thisOpacity;
        });
        node.style("fill-opacity", function (o) {
            thisOpacity = isConnected(d, o) ? 1 : opacity;
            return thisOpacity;
        });
        // also style link accordingly
        link.style("stroke-opacity", function (o) {
            return o.source === d || o.target === d ? 1 : opacity;
        });
        link.style("stroke", function (o) {
            return o.source === d || o.target === d ? o.source.colour : nodeColor(o.source);
        });
    };
}

function mouseOut() {
    node.style("stroke-opacity", 1);
    node.style("fill-opacity", 1);
    link.style("stroke-opacity", 1);
    link.style("stroke", function (d) {
        return nodeColor(d.source);
    });
}

function dragged(d) {
    //d.fx = d3v4.event.x;
    //d.fy = d3v4.event.y;
    node.filter(function (d) { return d.selected; })
        .each(function (d) {
            d.fx += d3.event.dx;
            d.fy += d3.event.dy;
        })
}

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

function brushstarted() {
    // keep track of whether we're actively brushing so that we
    // don't remove the brush on keyup in the middle of a selection
    brushing = true;

    node.each(function (d) {
        d.previouslySelected = shiftKey && d.selected;
    });
}

function brushed() {
    if (!d3.event.sourceEvent) return;
    if (!d3.event.selection) return;

    var extent = d3.event.selection;

    node.classed("selected", function (d) {
        return d.selected = d.previouslySelected ^
            (extent[0][0] <= d.x && d.x < extent[1][0]
                && extent[0][1] <= d.y && d.y < extent[1][1]);
    });
}

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

function zoomed() {
    
    var transform = d3.event.transform;
    var scale = 1 + (transform.k / 10);
    gDraw.attr("transform", "translate(" + transform.x + "," + transform.y + ") scale(" + transform.k + ")");
    
}

function selectionZoomed() {
    selectionDraw.attr("transform", d3.event.transform);
}

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
    //$("#accordion").accordion('activate', d.id);
}

function resetSelection() {
    selectedNode.style("stroke", "black");
    selectedNode = null;
}


function filterByMinValue(value, filteredAttributeName) {
    //var value = event.currentTarget.value;

    var minValue = document.getElementById(filteredAttributeName + "-sliderOutputMin").min;
    if (value < minValue) {
        value = minValue;
        document.getElementById(filteredAttributeName + "-sliderOutputMin").value = minValue;
    }

    if (!attributefilter[filteredAttributeName]) {
        attributefilter[filteredAttributeName] = {};
    }
    attributefilter[filteredAttributeName].low = value;

    store.nodes.forEach(function (n) {
        if (n[filteredAttributeName] === "")
            return;
        if (n[filteredAttributeName] < value) {
            if (!n.filters) {
                n.filters = [];
                graph.nodes.forEach(function (d, i) {
                    if (n.id === d.id) {
                        graph.nodes.splice(i, 1);
                    }
                });
                filterNodeList.push(n.id);
            }

            if (!n.filters.includes(filteredAttributeName + "_min")) {
                n.filters.push(filteredAttributeName + "_min");
            }

        }

        else if (n[filteredAttributeName] >= value && n.filters) {
            if (n.filters.length > 0 && n.filters.includes(filteredAttributeName + "_min")) {
                n.filters.splice(n.filters.indexOf(filteredAttributeName + "_min"), 1);
                if (n.filters.length === 0) {
                    graph.nodes.push($.extend(true, {}, n));
                    filterNodeList.splice(filterNodeList.indexOf(n.id), 1)
                    delete n.filters;
                }
            }
        }
        

        /*else if (n.filtered) {
            var isNotFilteredByAnyAtrribute = true;
            var numericDivs = $(".numeric");
            console.log(numericDivs);
            for (var i = 0; i < numericDivs.length; i++) {
                var attrName = numericDivs[i].querySelector("label").innerHTML;
                var minValue = numericDivs[i].querySelector("[id$=sliderOutputMin]").value;

                if (minValue > n[attrName]) {
                    isNotFilteredByAnyAtrribute = false;
                    break;
                }
            }

            if (isNotFilteredByAnyAtrribute) {
                delete n.filtered;
                graph.nodes.push($.extend(true, {}, n));
                filterNodeList.splice(filterNodeList.indexOf(n.id), 1)
            }

        
        }*/

        
    });

    store.links.forEach(function (l) {
        if (!(filterNodeList.includes(l.source) || filterNodeList.includes(l.target)) && l.filtered) {
            l.filtered = false;
            graph.links.push($.extend(true, {}, l));
        } else if ((filterNodeList.includes(l.source) || filterNodeList.includes(l.target)) && !l.filtered) {
            l.filtered = true;
            graph.links.forEach(function (d, i) {
                if (l.id === d.id) {
                    graph.links.splice(i, 1);
                }
            });
        }
    });		

    updateNodesAndLinks();
    updateForces();


}

function filterByMaxValue(value, filteredAttributeName) {
    //var value = event.currentTarget.value;
    var maxValue = document.getElementById(filteredAttributeName + "-sliderOutputMax").max;
    if (value > maxValue) {
        value = maxValue;
        document.getElementById(filteredAttributeName + "-sliderOutputMax").value = maxValue;
    }

    if (!attributefilter[filteredAttributeName]) {
        attributefilter[filteredAttributeName] = {};
    }
    attributefilter[filteredAttributeName].high = value;
    

    store.nodes.forEach(function (n) {
        if (n[filteredAttributeName] === "")
            return;
        if (n[filteredAttributeName] > value) {
            if (!n.filters) {
                n.filters = [];
                graph.nodes.forEach(function (d, i) {
                    if (n.id === d.id) {
                        graph.nodes.splice(i, 1);
                    }
                });
                filterNodeList.push(n.id);
            }

            if (!n.filters.includes(filteredAttributeName + "_max")) {
                n.filters.push(filteredAttributeName + "_max");
            }

        }

        else if (n[filteredAttributeName] <= value && n.filters) {
            if (n.filters.length > 0 && n.filters.includes(filteredAttributeName + "_max")) {
                n.filters.splice(n.filters.indexOf(filteredAttributeName + "_max"), 1);
                if (n.filters.length === 0) {
                    graph.nodes.push($.extend(true, {}, n));
                    filterNodeList.splice(filterNodeList.indexOf(n.id), 1)
                    delete n.filters;
                }
            }
        }
    });

    store.links.forEach(function (l) {
        if (!(filterNodeList.includes(l.source) || filterNodeList.includes(l.target)) && l.filtered) {
            l.filtered = false;
            graph.links.push($.extend(true, {}, l));
        } else if ((filterNodeList.includes(l.source) || filterNodeList.includes(l.target)) && !l.filtered) {
            l.filtered = true;
            graph.links.forEach(function (d, i) {
                if (l.id === d.id) {
                    graph.links.splice(i, 1);
                }
            });
        }
    });

    updateNodesAndLinks();
    updateForces();
}

function filterByCategory(filteredAttributeName, category, checked) {
    store.nodes.forEach(function (n) {
        if (n[filteredAttributeName] === "")
            return;
        if (!checked && n[filteredAttributeName] === category) {
            if (!attributefilter[filteredAttributeName]) {
                attributefilter[filteredAttributeName] = {};
            }
            attributefilter[filteredAttributeName].cat = category;
            if (!n.filters) {
                n.filters = [];
                graph.nodes.forEach(function (d, i) {
                    if (n.id === d.id) {
                        graph.nodes.splice(i, 1);
                    }
                });
                filterNodeList.push(n.id);
            }

            if (!n.filters.includes(filteredAttributeName + "_" + category)) {
                n.filters.push(filteredAttributeName + "_" + category);
            }

        }

        else if (checked && n[filteredAttributeName] === category && n.filters) {
            delete (attributefilter[filteredAttributeName]);
            if (n.filters.length > 0 && n.filters.includes(filteredAttributeName + "_" + category)) {
                n.filters.splice(n.filters.indexOf(filteredAttributeName + "_" + category), 1);
                if (n.filters.length === 0) {
                    graph.nodes.push($.extend(true, {}, n));
                    filterNodeList.splice(filterNodeList.indexOf(n.id), 1)
                    delete n.filters;
                }
            }
        }
    });

    store.links.forEach(function (l) {
        if (!(filterNodeList.includes(l.source) || filterNodeList.includes(l.target)) && l.filtered) {
            l.filtered = false;
            graph.links.push($.extend(true, {}, l));
        } else if ((filterNodeList.includes(l.source) || filterNodeList.includes(l.target)) && !l.filtered) {
            l.filtered = true;
            graph.links.forEach(function (d, i) {
                if (l.id === d.id) {
                    graph.links.splice(i, 1);
                }
            });
        }
    });

    updateNodesAndLinks();
    updateForces();
}

function addNewSelection() {
     var newId = selectionGraph.nodes.length === 0 ? 0 : parseInt(selectionGraph.nodes[selectionGraph.nodes.length - 1].id) + 1;

    var newSelection = {};
    newSelection['id'] = newId;
    newSelection['name'] = 'Selection ' + newId;
    newSelection['nonodes'] = 0;

    selectionGraph.nodes.push(newSelection);

    selectionGraph.nodes.forEach(function (d) {
        var newLink = {};
        newLink['source'] = newId;
        newLink['target'] = d.id;
        newLink['value'] = 0;

        var newLink2 = {};
        newLink2['source'] = d.id;
        newLink2['target'] = newId;
        newLink2['value'] = 0;

        selectionGraph.links.push(newLink);
        if (newId != d.id) {
            selectionGraph.links.push(newLink2);
        }


    });

    addSelectionDiv(newSelection)
    updateSelectionNodesAndLinks();
}

function addSelectionDiv(selection) {
    
    var newId = selection.id;
    newId = newId.toString();

    var mainDiv = d3.select('#list-selections');

    var panel = mainDiv
        .append('div')
        .classed('panel', true)
        .attr('id', 'selection_panel_' + newId);

    var panel_heading = panel.append('div')
        .attr('class', 'panel-heading')
        .attr('role', 'tab')
        .attr('id', 'heading_selection_' + newId);

    panel_heading.append('input')
        .attr('type', 'color')
        .attr('id', 'selection_color_' + newId)
        .attr('value', groupColours(newId))
        .attr('onchange', 'changeGroupColour(this.value,' + newId + ')');

    var panel_list = panel_heading
        .append('ul')
        .attr('class', 'list-inline m-0')
        .style('float', 'right');

    var panel_list_add = panel_list.append('li')
        .attr('class', 'list-inline-item');

    var panel_list_add_btn = panel_list_add.append('button')
        .attr('class', 'btn btn-danger btn-sm rounded-0')
        .attr('type', 'button')
        .attr('data-toggle', 'tooltip')
        .attr('data-placement', 'top')
        .attr('title', 'Add Selected Nodes To This Group')
        .attr('onclick', "addNodesToSelection(\"" + newId + "\")");

    panel_list_add_btn.append('i')
        .attr('class', 'fa fa-plus-square');

    var panel_list_delete = panel_list.append('li')
        .attr('class', 'list-inline-item');

    var panel_list_delete_btn = panel_list_delete.append('button')
        .attr('class', 'btn btn-danger btn-sm rounded-0')
        .attr('type', 'button')
        .attr('data-toggle', 'tooltip')
        .attr('data-placement', 'top')
        .attr('title', 'Delete')
        .attr('onclick', 'deleteSelection(\"' + newId + '\")');

    panel_list_delete_btn.append('i')
        .attr('class', 'fa fa-trash');

    panel_heading.append('h4')
        .attr('class', 'panel-title')
        .html("Selection" + newId);
        
}

function addNodesToSelection(selectionId) {

    node.filter(function (d) { return d.selected })
        .each(function (d) {
            var previousGroup;
            if (graph.partitions[d.id] != "") {
                previousGroup = graph.partitions[d.id];
                link.filter(function (l) { return l.source.id == d.id || l.target.id == d.id })
                    .each(function (l) {
                        if (graph.partitions[l.source.id] != "" && graph.partitions[l.target.id] != "") {
                            var value = l.value;
                            
                            if (l.source.id == d.id && graph.partitions[l.target.id] != "") {
                                //var previousSelectionLink = d3.select("#selection_link_" + previousGroup + "-" + graph.partitions[l.target.id]);
                                var newSelectionLink = selectionGraph.links.find(x => x.source.id == selectionId && x.target.id == graph.partitions[l.target.id]);
                                var previousSelectionLink = selectionGraph.links.find(x => x.source.id == previousGroup && x.target.id == graph.partitions[l.target.id]);
                                previousSelectionLink.value = previousSelectionLink.value - value;
                                newSelectionLink.value = previousSelectionLink.value + value;
                            }

                            else if (l.target.id == d.id && graph.partitions[l.source.id] != "") {
                                var previousSelectionLink = selectionGraph.links.find(x => x.source.id == graph.partitions[l.source.id] && x.target.id == previousGroup);
                                var newSelectionLink = selectionGraph.links.find(x => x.source.id == graph.partitions[l.source.id] && x.target.id == selectionId);
                                previousSelectionLink.value = previousSelectionLink.value - value;
                                newSelectionLink.value = previousSelectionLink.value + value;
                            }
                        }
                    });

                var previousSelectionNode = selectionGraph.nodes.find(x => x.id == previousGroup);
                previousSelectionNode.nonodes = previousSelectionNode.nonodes - 1;

            }

            else {
                link.filter(function (l) { return l.source.id == d.id || l.target.id == d.id })
                    .each(function (l) {
                        var value = l.value;

                        if (l.source.id == d.id &&  graph.partitions[l.target.id] != "") {
                            var newSelectionLink = selectionGraph.links.find(sl => sl.source.id == selectionId && sl.target.id == graph.partitions[l.target.id] != "");
                            newSelectionLink.value = newSelectionLink.value + value;
                        }

                        else if (l.target.id == d.id && graph.partitions[l.source.id] != "") {
                            var newSelectionLink = selectionGraph.links.find(sl => sl.source.id == graph.partitions[l.source.id] != "" && sl.target.id == selectionId);
                            newSelectionLink.value = newSelectionLink.value + value;
                        }
                        
                    });

                
                
            }

            var newSelectionNode = selectionGraph.nodes.find(x => x.id == selectionId);
            newSelectionNode.nonodes = newSelectionNode.nonodes + 1;
                    
               

            graph.partitions[d.id] = selectionId;
            
            
        })
        .style('fill', function (d) {
            return document.getElementById("selection_color_" + selectionId).value;
        })

    //updateSelectionNodesAndLinks();

    selectionNode.select("title")
        .text(function (d) {
            return "Number of Nodes: " + d.nonodes;
        })

    selectionLink.select("title")
        .text(function (d) {
            return d.value;
        })

}

function deleteAllSelections() {
    /*selectionNode.each(function (d) {
        var selectionPanel = document.querySelector('#selection_panel_' + d.id);
        selectionPanel.parentNode.removeChild(selectionPanel);

        
    })*/

    node.style("fill", defaultColour);

    selectionGraph.nodes = [];
    selectionGraph.links = [];

    updateSelectionNodesAndLinks();

    var selectionList = document.querySelector('#list-selections');
    selectionList.innerHTML = "";

}

function deleteSelection(selectionId) {
    var selectionPanel = document.querySelector('#selection_panel_' + selectionId);
    selectionPanel.parentNode.removeChild(selectionPanel);

    node.filter(function (d) { return graph.partitions[d.id] == selectionId; })
        .style("fill", defaultColour)
        .each(function (n) {
            graph.partitions[n.id] = "";
        })

    
    selectionGraph.nodes = selectionGraph.nodes.filter(function (n) { return n.id != selectionId });
    selectionGraph.links = selectionGraph.links.filter(function (d) { return d.source.id != selectionId && d.target.id != selectionId });
        

    updateSelectionNodesAndLinks();
    //updateSelectionForces()
    
}

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

function projectAttribute(axis, attributeName) {
    var x_projection = $("#droplist_x").val();
    var y_projection = $("#droplist_y").val();

    var attributeMax = $("#" + attributeName + "-sliderOutputMin").attr("max");
    var attributeMin = $("#" + attributeName + "-sliderOutputMin").attr("min");

    if (x_projection === "" && y_projection === "") {
        //forceProperties.charge.enabled = true;
        /*simulation.force("link").strength(function (link) {
            return 1 / Math.min(count(link.source), count(link.target));
        });*/

    }

    if (axis === 'x') {
        if (attributeName === "") {
            simulation.force("forceX")
                .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
                .x(width * forceProperties.forceX.x);
        }

        else {
            forceProperties.forceX.enabled = true;
            //forceProperties.charge.enabled = false;
            //simulation.force("link").strength(0);
            simulation.force("forceX")
                .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
                .x(function (d) {
                    if (d[attributeName] == "") {
                        return width / 2;
                    }

                    var value = width * ((parseFloat(d[attributeName]) - attributeMin) / (attributeMax - attributeMin));
                    return value;
                });
        }
    }

    else if (axis === 'y') {
        if (attributeName === "") {
            simulation.force("forceY")
                .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
                .y(height * forceProperties.forceY.y);
        }

        else {
            forceProperties.forceY.enabled = true;
            //forceProperties.charge.enabled = false;
            //simulation.force("link").strength(0);
            simulation.force("forceY")
                .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
                .y(function (d) {
                    if (d[attributeName] == "") {
                        return height / 2;
                    }
                    var value = height * ((parseFloat(d[attributeName]) - attributeMin) / (attributeMax - attributeMin));
                    return value;
                    
                });
        }
    }

    updateForces();
}

function updateNodeGroups() {
    node.style("fill", function (d) {
        document.getElementById("panel_" + d.id).style.borderColor = groupColours(graph.partitions[d.id]);
        if (graph.partitions[d.id] != "") {

            return groupColours(graph.partitions[d.id]);

        }
        else {
            return defaultColour;
        }
    })
    
}

function updateNodesAndLinks() {
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
    updateNodeGroups();

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
        return nodeColor(l.source);
    });

    

    
}

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

function requestCommunityDetection() {
    store.nodes.forEach(function (d) {
        graph.partitions[d.id] = "";
    });

    var graph_string = JSON.stringify(graph);


    $.ajax({
        url: 'GraphCommunityDetection',
        type: 'POST',
        dataType: 'json',
        // It is important to set the content type
        // request header to application/json because
        // that's how the client will send the request
        //contentType: 'application/json',
        data: { graphFilt: graph_string},
        //cache: false,
        success: function (result) {
            deleteAllSelections();
            
            graph.partitions = JSON.parse(result.newPartitions);
            selectionGraph = JSON.parse(result.newSelections);

            selectionGraph.nodes.forEach(function (d) {
                addSelectionDiv(d);
            });

            updateNodesAndLinks();
            updateSelectionNodesAndLinks();
            //updateSelectionForces();

        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(thrownError);
        }
    });
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
});

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});


