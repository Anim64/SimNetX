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

//Update X and Y force to project nodes on axes
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

function createDoubleSlider(sliderId, minValueId, maxValueId, minValue, maxValue) {
    $("#" + sliderId).slider({
        range: true,
        min: minValue,
        max: maxValue,
        values: [minValue, maxValue],
        step: 0.01,
        slide: function (event, ui) {
            $("#" + minValueId).val(ui.values[0]);
            $("#" + maxValueId).val(ui.values[1]);

            if (ui.handleIndex === 0) {
                filterByMinValue(ui.value, minValueId.split("-")[0])
            }
            else if (ui.handleIndex === 1) {
                filterByMaxValue(ui.value, maxValueId.split("-")[0])
            }
        }
    });
    //$("#" + minValueId).val($("#" + sliderId).slider("values", 0));
    //$("#" + maxValueId).val($("#" + sliderId).slider("values", 1));

}