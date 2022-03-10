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

function projectAttributeXAxis(selectElement) {
    var attributeName = selectElement.value;

    if (attributeName === "") {
        simulation.force("forceX")
            .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
            .x(width * forceProperties.forceX.x);
    }

    else {

        forceProperties.forceX.enabled = true;
        //forceProperties.charge.enabled = false;
        //simulation.force("link").strength(0);
        var optgroup = selectElement.options[selectElement.selectedIndex].closest('optgroup').getAttribute('label');


        if (optgroup === "Attributes") {
            var attributeMax = $("#" + attributeName + "-sliderOutputMin").attr("max");
            var attributeMin = $("#" + attributeName + "-sliderOutputMin").attr("min");

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

        else if (optgroup === "Centralities"){
            var attributeMax = graph.properties[attributeName].max;
            var attributeMin = graph.properties[attributeName].min;

            simulation.force("forceX")
                .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
                .x(function (d) {
                    if (graph.properties[attributeName].values[d.id] == "") {
                        return width / 2;
                    }

                    var value = width * ((parseFloat(graph.properties[attributeName].values[d.id]) - attributeMin) / (attributeMax - attributeMin));
                    return value;
                });
        }
    }

    updateForces();
}

function projectAttributeYAxis(selectElement) {
    var attributeName = selectElement.value;

    if (attributeName === "") {
        simulation.force("forceY")
            .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
            .y(height * forceProperties.forceY.y);
    }

    else {

        forceProperties.forceY.enabled = true;
        //forceProperties.charge.enabled = false;
        //simulation.force("link").strength(0);
        var optgroup = selectElement.options[selectElement.selectedIndex].closest('optgroup').getAttribute('label');


        if (optgroup === "Attributes") {
            var attributeMax = $("#" + attributeName + "-sliderOutputMin").attr("max");
            var attributeMin = $("#" + attributeName + "-sliderOutputMin").attr("min");

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

        else if (optgroup === "Centralities") {
            var attributeMax = graph.properties[attributeName].max;
            var attributeMin = graph.properties[attributeName].min;

            simulation.force("forceY")
                .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
                .y(function (d) {
                    if (graph.properties[attributeName].values[d.id] == "") {
                        return height / 2;
                    }

                    var value = height - (height * ((parseFloat(graph.properties[attributeName].values[d.id]) - attributeMin) / (attributeMax - attributeMin)));
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

function hideConversionParameters() {
    var conversion_parameters_divs = document.getElementsByClassName("remodel-parameters-div");
    Array.prototype.forEach.call(conversion_parameters_divs, function (conversion_parameters_div) {
        conversion_parameters_div.style.display = "none";
    });
}

function displayConversionParameters(conversion_alg) {

    hideConversionParameters();
    var remodel_parameters_headline = document.getElementById("remodel-parameters-headline");

    if (conversion_alg === "Epsilon") {
        var epsilon_parameters_div = document.getElementById("epsilon-parameters");
        epsilon_parameters_div.style.display = "grid";
        remodel_parameters_headline.style.display = "block";
    }

    else {
        remodel_parameters_headline.style.display = "none";
    }

    remodel_parameters_headline.parentElement.style.height = "auto";
}

function remodelNetwork(checkboxesDivId, algorithmSelectId) {
    var attributeCheckboxDiv = document.querySelector('#' + checkboxesDivId);
    var selectedAlgorithm = document.querySelector('#' + algorithmSelectId).value;

    var checkboxes = attributeCheckboxDiv.querySelectorAll("input[type='checkbox']:checked");
    var selected_attributes = Array.prototype.map.call(checkboxes, function (checkbox) {
        return checkbox.value;
    });

    var newNet;

    switch (selectedAlgorithm) {
        default:
        case 'LRNet':
            newNet = LRNet(graph.nodes, selected_attributes, gaussianKernel);
            break;
        

        case 'Epsilon':
            var epsilonRadius = parseFloat(document.querySelector('#epsilonRadius').value);
            var k = parseInt(document.querySelector('#kNNmin').value);
            newNet = EpsilonAndkNN(graph.nodes, selected_attributes, gaussianKernel, epsilonRadius, k);
            break;
    }

    graph.links = newNet;
    updateLinks();
    
}

function gaussianKernel(nodes, attributes, sigma = 1) {
    var gaussianKernel = new Array(nodes.length * nodes.length);
    let nodeCount = nodes.length;
    nodes.forEach(function (node, index) {
        for (let i = index; i < nodes.length; i++){
            
            if (i === index) {
                gaussianKernel[index * nodeCount + i] = 1
            }
            else {
                let distance = euclideanDistance(node, nodes[i], attributes);
                gaussianKernel[index * nodeCount + i] = gaussianKernel[i * nodeCount + index] = (1.0 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp((-distance) / (2 * Math.pow(sigma, 2)));
            }
            
        }
    });

    return gaussianKernel;
}



function euclideanDistance(node1, node2, attributes) {
    let result = 0;
    attributes.forEach(function (attribute) {
        if (typeof node1[attribute] == 'number' && typeof node2[attribute] == 'number') {
            result += Math.pow(node1[attribute] - node2[attribute], 2);
        }
    });

    return result;
}

function EpsilonAndkNN(nodes, attributes, kernelMatrixFunction, similarity_threshold = 0.5, k = 1) {
    let resultNet = new Array();
    let kernel = kernelMatrixFunction(nodes, attributes);
    let potentialNeighbours = Array.from(Array(nodes.length).keys());
    let nodeCount = nodes.length;
    var duplicateCheckDict = {};
    let edgeId = -1;
    nodes.forEach(function (node, index) {
        
        
        potentialNeighbours.sort(function (node1, node2) {
            if (kernel[index * nodeCount + node1] < kernel[index * nodeCount + node2]) {
                return 1;
            }

            if (kernel[index * nodeCount + node1] > kernel[index * nodeCount + node2]) {
                return -1;
            }

            return 0;
        });

        var edgeCount = 0;
        let n = 0;
        while ((edgeCount < k || kernel[index * nodeCount + potentialNeighbours[n]] > similarity_threshold) && n < nodeCount) {
            if (index !== potentialNeighbours[n] && (duplicateCheckDict[String(node.index) + String(nodes[potentialNeighbours[n]].index)] == undefined || duplicateCheckDict[String(nodes[potentialNeighbours[n]].index) + String(node.index)] == undefined)) {
                duplicateCheckDict[String(node.index) + String(nodes[potentialNeighbours[n]].index)] = 1;
                duplicateCheckDict[String(nodes[potentialNeighbours[n]].index) + String(node.index)] = 1;
                let newLink = {
                    source: node.id,
                    target: nodes[potentialNeighbours[n]].id,
                    value: 1,
                    id: ++edgeId
                };
                resultNet.push(newLink);
                edgeCount++;
                
            }
            n++;
        }
    });

    return resultNet;
}

function LRNet(nodes, attributes, kernelMatrixFunction) {
    let resultNet = new Array();
    let kernel = kernelMatrixFunction(nodes, attributes);
    let degrees = {};
    let significances = {};
    let representativeness = {};
    let nodeCount = nodes.length;
    let edgeId = -1;

    nodes.forEach(function (node1, index1) {
        let nearestNeighbour = -1;
        let maxSimilarity = -1;
        nodes.forEach(function (node2, index2) {
            if (index1 === index2) {
                return;
            }

            if (!degrees.hasOwnProperty(index1)) {
                degrees[index1] = 0;
                significances[index1] = 0;
            }

            if (kernel[index1 * nodeCount + index2] > 0) {
                degrees[index1]++;
            }

            if (kernel[index1 * nodeCount + index2] > maxSimilarity) {
                maxSimilarity = kernel[index1 * nodes.length + index2];
                nearestNeighbour = index2;
            }
        });

        if (!significances.hasOwnProperty(nearestNeighbour)) {
            significances[nearestNeighbour] = 0;
        }

        significances[nearestNeighbour]++;
    });
    var duplicateCheckDict = {};
    nodes.forEach(function (node, index) {
        if (significances[index] > 0) {
            representativeness[index] = 1.0 / (Math.pow((1 + degrees[index]), (1.0 / significances[index])));
        }

        else {
            representativeness[index] = 0;
        }

        let k = parseInt(Math.round(representativeness[index] * degrees[index]), 10);

        let potentialNeighbours = Array.from(Array(nodeCount).keys());
        potentialNeighbours.sort(function (node1, node2) {
            if (kernel[index * nodeCount + node1] < kernel[index * nodeCount + node2]) {
                return 1;
            }

            if (kernel[index * nodeCount + node1] > kernel[index * nodeCount + node2]) {
                return -1;
            }
    
            return 0;
        });
        let l;
        if (k > 0) {
            l = k + 1;
        }

        else {
            l = 2;
        }

        for (let n = 0; n < l; n++) {
            if (index !== potentialNeighbours[n] && (duplicateCheckDict[String(node.index) + String(nodes[potentialNeighbours[n]].index)] == undefined || duplicateCheckDict[String(nodes[potentialNeighbours[n]].index) + String(node.index)] == undefined)) {
                duplicateCheckDict[String(node.index) + String(nodes[potentialNeighbours[n]].index)] = 1;
                duplicateCheckDict[String(nodes[potentialNeighbours[n]].index) + String(node.index)] = 1;
                let newLink = {
                    source: node.id,
                    target: nodes[potentialNeighbours[n]].id,
                    value: 1,
                    id: ++edgeId
                };
                resultNet.push(newLink);
            }
        }
    });

    return resultNet;
}

function changeNetworkNodeColour(colour) {
    defaultColour = colour;
    node.style("fill", function (d) {
        return nodeColor(d.id);

    });

    link.style("stroke", function (l) {
        return nodeColor(l.source.id);

    });
}

function changeNetworkBackgroundColour(colour) {
    var i = d3.select('#network-background-rect.background').style("fill", colour);
    var p = 0;
}
