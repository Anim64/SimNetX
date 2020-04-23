var graph = null;
var store = null;
var filterNodeList = [];

var node = null;

var link = null;

var rect = null;
var gBrushHolder = null;
var gBrush = null;
var brushMode = false;
var brushing = false;
var brush = null;
var gDraw = null;



//var nodeColor = "#000000";


var svg = d3.select("svg")
    

var width = svg.node().getClientRects()[0].width,
    height = svg.node().getClientRects()[0].height;




var simulation = d3.forceSimulation()
    .force("link", d3.forceLink())
    .force("charge", d3.forceManyBody())
    .force("collide", d3.forceCollide())
    .force("center", d3.forceCenter())
    .force("forceX", d3.forceX())
    .force("forceY", d3.forceY())
    .force("radial", d3.forceRadial());

var groupColours = d3.scaleOrdinal(d3.schemeCategory10);
var defaultColour = "#FF0000";

var selectedNode = null;
var shiftKey = null;



var forceProperties = {
    center: {
        x: 0.5,
        y: 0.30
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
        enabled: true,
        distance: 50,
        iterations: 1
    },

    radial: {
        enabled: false,
        x: 0.5,
        y: 0.5,
        strength: 0.1,
        radius: 1
    }


};

function drawNetwork(data) {

    graph = data;

    /*for (var node1 in graph["nodes"]) {
        node1.color = nodeColor;
    }*/
    svg.selectAll('.g-main').remove();

    var gMain = svg.append('g')
        .classed('g-main', true);

    rect = gMain.append('rect')
        .attr('width', width)
        .attr('height', height)
        .style('fill', '#333333')

    gDraw = gMain.append('g');

    var zoom = d3.zoom()
        .on('zoom', zoomed)

    gMain.call(zoom);

    gBrushHolder = gDraw.append('g');
    

    

    /*brush.call(brusher)
        .on("mousedown.brush", null)
        .on("touchstart.brush", null)
        .on("touchmove.brush", null)
        .on("touchend.brush", null);

    brush.select('.background').style('cursor', 'auto');*/


    link = gDraw.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line");

    link.append("title")
        .text(function (l) {
            return l.id;
        });
    
    node = gDraw.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .style("fill", function (d) {
            if (d.group) {
                return groupColours(d.group);
            }
            else {
                return defaultColour;
            }

        })
        .attr("r", forceProperties.collide.radius)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("click", displayNodeProperties);

        

    
    node.append("title")
        .text(function (d) { return d.id; });

    brushMode = false;
    brushing = false;

    brush = d3.brush()
        .on("start", brushstarted)
        .on("brush", brushed)
        .on("end", brushended);

    //svg.on("click", resetSelection);
    //svg.call(zoomer);

    /*d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.5, 8])
        .on("zoom", zoomed)*/

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

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    updateForces();
    simulation.force("link")
        .links(graph.links);



}

function ticked() {
    link
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

    node
        .attr("cx", function (d) { return d.x = Math.max(forceProperties.collide.radius, Math.min(width - forceProperties.collide.radius, d.x)); })
        .attr("cy", function (d) { return d.y = Math.max(forceProperties.collide.radius, Math.min(height - forceProperties.collide.radius, d.y)); });
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
    gDraw.attr('transform', d3.event.transform);
}

function keydown() {
    shiftKey = d3.event.shiftKey;

    if (shiftKey) {
        // if we already have a brush, don't do anything
        if (gBrush)
            return;

        brushMode = true;

        if (!gBrush) {
            gBrush = gBrushHolder.append('g');
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
    $("#accordion").accordion('activate', d.id);
}

function resetSelection() {
    selectedNode.style("stroke", "black");
    selectedNode = null;
}


function filterByMinValue(value, filteredAttributeName) {
    //var value = event.currentTarget.value;

    store.nodes.forEach(function (n) {
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

    store.nodes.forEach(function (n) {
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

function filterByCategory(category, filteredAttributeName) {
    store.nodes.forEach(function (n) {
        if (!this.checked && n.filteredAttributeName === category) {
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

        else if (this.checked && n.filteredAttributeName === category && n.filters) {
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
    simulation.force("forceX")
        .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
        .x(width * forceProperties.forceX.x);
    simulation.force("forceY")
        .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
        .y(height * forceProperties.forceY.y);
    simulation.force("link")
        .id(function (d) { return d.id; })
        .distance(forceProperties.link.distance)
        .iterations(forceProperties.link.iterations)
        .links(forceProperties.link.enabled ? graph.links : []);
    simulation.force("radial")
        .x(forceProperties.radial.x * width)
        .y(forceProperties.radial.y * height)
        .strength(forceProperties.radial.strength)
        .radius(forceProperties.radial.radius);

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    simulation.alpha(1).restart();
}

function updateNodesAndLinks() {
    node = node.data(graph.nodes, function (d) { return d.id; });
    //	EXIT
    node.exit().remove();

    var newNode = node.enter().append("circle")
        .style("fill", function (d) {
            if (d.group) {
                return color(d.color);
            }
            else {
                return "FF0000";
            }
        })
        .attr("r", forceProperties.collide.radius)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("click", displayNodeProperties);

    newNode.append("title")
        .text(function (d) { return d.id; });

    node = node.merge(newNode);

    link = link.data(graph.links, function (d) { d.source });
    //	EXIT
    link.exit().remove();

    var newLink = link.enter().append("line");

    link = link.merge(newLink);

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    simulation.alpha(1).restart();
}

function updateDisplay() {
    node
        .attr("r", forceProperties.collide.radius)
        .style("stroke", forceProperties.charge.strength > 0 ? "blue" : "red")
        .style("stroke-width", forceProperties.charge.enabled == false ? 0 : Math.abs(forceProperties.charge.strength) / 15);

    link
        .style("stroke-width", forceProperties.link.enabled ? 1 : .5)
        .style("opacity", forceProperties.link.enabled ? 1 : 0);
}

function updateAll() {
    updateForces();
    updateDisplay();
}

d3.select(window).on("resize", function () {
    width = +svg.node().getBoundingClientRect().width;
    height = +svg.node().getBoundingClientRect().height;
    updateForces();
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


