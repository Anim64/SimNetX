var graph = null;
var store = null;
var filterNodeList = [];

var node = null;

var link = null;

var nodeColor = "#000000";

var svg = d3.select("svg"),
    width = svg.node().getClientRects()[0].width,
    height = svg.node().getClientRects()[0].height;

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink())
    .force("charge", d3.forceManyBody())
    .force("collide", d3.forceCollide())
    .force("center", d3.forceCenter())
    .force("forceX", d3.forceX())
    .force("forceY", d3.forceY())
    .force("radial", d3.forceRadial());

var selectedNode = null;

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

    for (var node1 in graph["nodes"]) {
        node1.color = nodeColor;
    }


    link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line");

    link.append("title")
        .text(function (l) {
            return l.id;
        });
    
    node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        /*.style("fill", function (d) {
            const scale = d3.scaleSequential()
                .domain([0, 100])
                .interpolator(d3.interpolateRainbow);//d3.scaleOrdinal(d3.schemeCategory10);
            return d.color;
        })*/
        .attr("r", forceProperties.collide.radius)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("click", displayNodeProperties);

    
    node.append("title")
        .text(function (d) { return d.id; });

    //svg.on("click", resetSelection);
    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.5, 8])
        .on("zoom", zoomed));


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
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function zoomed() {
    node.attr("transform", d3.event.transform);
    link.attr("transform", d3.event.transform);
}

function displayNodeProperties(d) {
    d3.select(this).style("stroke", "#FFFF00");

    node_properties_div = d3.select("#node_properties");
    node_properties_div.selectAll("*").remove();

    node_properties_div.append("h2")
        .html("Node " + d.id + " properties");

    for (var i in store["nodes"][d.id]) {
        node_properties_div.append("label")
            .attr("for", i + "-" + d.id)
            .attr("class", "form-check-label")
            .html(i);
        node_properties_div.append("input")
            .attr("type", "text")
            .attr("id", i + "-" + d.id)
            .attr("class", "form-control")
            .attr("value", d[i])
            .attr("readonly", true);
    }
    node_properties_div.append("label")
        .attr("for", "color-" + d.id)
        .attr("class", "form-check-label")
        .html("node color");
    node_properties_div.append("input")
        .attr("type", "color")
        .attr("id", "color-" + d.id)
        .attr("value", d.color);

    

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
            /*const scale = d3.scaleSequential()
                .domain([0, 100])
                .interpolator(d3.interpolateRainbow);*///d3.scaleOrdinal(d3.schemeCategory10);
            return d.color;
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


