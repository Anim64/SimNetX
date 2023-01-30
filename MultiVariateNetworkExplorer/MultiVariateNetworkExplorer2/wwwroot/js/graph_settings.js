
const isLower = function(value1, value2) {
    return value1 < value2;
}

const isGreater = function(value1, value2) {
    return value1 > value2;
}


class FilterCondition {
    
    constructor(booleanFunction) {
        this.booleanFunction = booleanFunction;
    }
};

const lower = new FilterCondition(isLower);
    const greater = new FilterCondition(isGreater);


const filterByValue = function (input, filteredAttributeName, filterCondition, minmax) {
    //var value = event.currentTarget.value;

    let value = input.value;
    const extremeValue = !minmax ? input.min : input.max;
    const filterSuffix = !minmax ? "_min" : "_max";
    const attributeFilterType = !minmax ? "low" : "high";
    if (filterCondition.booleanFunction(value, extremeValue)) {
        value = extremeValue;
        input.value = extremeValue;
    }

    if (!attributefilter[filteredAttributeName]) {
        attributefilter[filteredAttributeName] = {};
    }
    attributefilter[filteredAttributeName][attributeFilterType] = value;


    const { nodes: storeNodes, links: storeLinks } = store;
    const { nodes: graphNodes, links: graphLinks } = graph;

    //for (const n of graphNodes) {
    storeNodes.forEach(function (n) {
        const { [filteredAttributeName]: filAttrVal } = n;
        const nodeHeading = $('#heading-' + n.id);
        if (filAttrVal === "")
            return;
        if (filterCondition.booleanFunction(filAttrVal, value)) {
            if (!n.filters) {
                n.filters = [];
                for (const [i, d] of graphNodes.entries()) {
                    if (n.id === d.id) {
                        graphNodes.splice(i, 1);
                    }
                };
                filterNodeList.push(n.id);
                nodeHeading.addClass('node-heading-disabled');
            }

            if (!n.filters.includes(filteredAttributeName + filterSuffix)) {
                n.filters.push(filteredAttributeName + filterSuffix);
            }

        }

        else if (!filterCondition.booleanFunction(filAttrVal, value) && n.filters) {
            if (n.filters.length > 0 && n.filters.includes(filteredAttributeName + filterSuffix)) {
                n.filters.splice(n.filters.indexOf(filteredAttributeName + filterSuffix), 1);
                if (n.filters.length === 0) {
                    graphNodes.push($.extend(true, {}, n));
                    filterNodeList.splice(filterNodeList.indexOf(n.id), 1);
                    delete n.filters;
                    nodeHeading.removeClass('node-heading-disabled');
                }
            }
        }
    });

    storeLinks.forEach(function (l) {
        const { source, target } = l;
        if (!(filterNodeList.includes(source) || filterNodeList.includes(target)) && l.filtered) {
            l.filtered = false;
            graphLinks.push($.extend(true, {}, l));
        } else if ((filterNodeList.includes(source) || filterNodeList.includes(target)) && !l.filtered) {
            l.filtered = true;
            for (const [i, d] of graphLinks.entries()) {
                if (l.id === d.id) {
                    graphLinks.splice(i, 1);
                }
            };
        }
    });

    updateNodesAndLinks();
    resetSimulation();

}

const filterByCategory = function (filteredAttributeName, category, checked) {
    const { nodes: storeNodes, links: storeLinks } = store;
    const { nodes: graphNodes, links: graphLinks } = graph;

    storeNodes.forEach(function (n) {
        const { [filteredAttributeName]: filAttrVal } = n;
        if (filAttrVal === "")
            return;
        if (!checked && filAttrVal === category) {
            if (!attributefilter[filteredAttributeName]) {
                attributefilter[filteredAttributeName] = {};
            }
            attributefilter[filteredAttributeName].cat = category;
            if (!n.filters) {
                n.filters = [];
                graphNodes.forEach(function (d, i) {
                    if (n.id === d.id) {
                        graphNodes.splice(i, 1);
                    }
                });
                filterNodeList.push(n.id);
            }

            if (!n.filters.includes(filteredAttributeName + "_" + category)) {
                n.filters.push(filteredAttributeName + "_" + category);
            }

        }

        else if (checked && filAttrVal === category && n.filters) {
            delete (attributefilter[filteredAttributeName]);
            if (n.filters.length > 0 && n.filters.includes(filteredAttributeName + "_" + category)) {
                n.filters.splice(n.filters.indexOf(filteredAttributeName + "_" + category), 1);
                if (n.filters.length === 0) {
                    graphNodes.push($.extend(true, {}, n));
                    filterNodeList.splice(filterNodeList.indexOf(n.id), 1);
                    delete n.filters;
                }
            }
        }
    });

    storeLinks.forEach(function (l) {
        const { source, target } = l;
        if (!(filterNodeList.includes(source) || filterNodeList.includes(target)) && l.filtered) {
            l.filtered = false;
            graphLinks.push($.extend(true, {}, l));
        } else if ((filterNodeList.includes(source) || filterNodeList.includes(target)) && !l.filtered) {
            l.filtered = true;
            graphLinks.forEach(function (d, i) {
                if (l.id === d.id) {
                    graph.links.splice(i, 1);
                }
            });
        }
    });

    updateNodesAndLinks();
    resetSimulation();
   
}

const handleForceEnablement = function(value, force, forceUpdateDelegate){
    forceProperties[force].enabled = value;
    forceUpdateDelegate();
    resetSimulation();
}

const handleForceChange = function (value, sliderOutputId, force, property, forceUpdateDelegate) {
    d3.select('#' + sliderOutputId).text(value);
    forceProperties[force][property] = Number(value);
    forceUpdateDelegate();
    resetSimulation();
}

const getNodeAttribute = function (d, attributeName) {
    return d[attributeName];
};
const getNodeProperty = function (d, attributeName) {
    return graph.properties[attributeName].values[d.id];
};

const enableNodeLabels = function () {
    nodeText.classed('invisible', !forceProperties.labels.enabled);
}

const setNodeLabel = function (selectElement) {
    const attributeName = selectElement.value;
    const optgroup = selectElement.options[selectElement.selectedIndex].closest('optgroup');
    forceProperties.labels.attribute = attributeName;
    if (attributeName === "") {
        nodeText.style("display", "none");
    }

    nodeText.style("display", "block");

    let getValueFunction = getNodeAttribute;

    if (optgroup !== null) {
        const optGroupLabel = optgroup.getAttribute('label');

        if (optGroupLabel === "Centralities") {
            getValueFunction = getNodeProperty;
        }
    }
    
    nodeText.text(function (d) {
        const attributeValue = getValueFunction(d, attributeName);
        return attributeValue;
    });
}
const setAttributeNodeSizing = function (selectElement) {
    const attributeName = selectElement.value;
    const { radius: defaultRadius } = forceProperties.collide;
    forceProperties.sizing.attribute = attributeName;

    if (attributeName !== "") {
        forceProperties.sizing.enabled = true;
        const optgroup = selectElement.options[selectElement.selectedIndex].closest('optgroup').getAttribute('label');
        let attributeMax = null;
        let attributeMin = null;
        let getValueFunction = null;

        if (optgroup === "Attributes") {
            attributeMax = parseFloat($("#" + attributeName + "-sliderOutputMin").attr("max"));
            attributeMin = parseFloat($("#" + attributeName + "-sliderOutputMin").attr("min"));
            getValueFunction = getNodeAttribute;
        }

        else if (optgroup === "Centralities") {
            attributeMax = graph.properties[attributeName].max;
            attributeMin = graph.properties[attributeName].min;
            getValueFunction = getNodeProperty;
        }

        node.attr("r", function (d) {
            const attributeValue = getValueFunction(d, attributeName);
            if (attributeValue == "") {
                
                return d.r = defaultRadius / 2;
            }

            const resultRadius = (defaultRadius * 2) * ((parseFloat(attributeValue) - attributeMin) / (attributeMax - attributeMin)) + 1;
            return d.r = resultRadius;
        });

        setNodeFontSize();
        return;

        
    }

    forceProperties.sizing.enabled = false;
    node.attr("r", function (d) {
        return d.r = defaultRadius;
    });
    setNodeFontSize();
}

const rgbObjectToString = function (rgbObject) {
    const rgb = 'rgb(' + rgbObject.r + ', '
        + rgbObject.g + ', '
        + rgbObject.b + ')';
    return rgb;
}
const pickHex = function(color1, color2, weight) {
    const w2 = weight;
    const w1 = 1 - w2; 
    const rgb = {
        r: Math.round(color1.r * w1 + color2.r * w2),
        g: Math.round(color1.g * w1 + color2.g * w2),
        b: Math.round(color1.b * w1 + color2.b * w2)
    };
    return rgb;
}

const setAttributeNodeColouring = function (selectElement) {
    const { lowValue, highValue } = forceProperties.attributeColouring;
    const lowValueColour = hexToRgb(lowValue);
    const highValueColour = hexToRgb(highValue);

    const attributeName = selectElement.value;
    forceProperties.attributeColouring.attribute = attributeName;


    if (attributeName !== "") {
        forceProperties.attributeColouring.enabled = true;
        const optgroup = selectElement.options[selectElement.selectedIndex].closest('optgroup').getAttribute('label');
        let attributeMax = null;
        let attributeMin = null;
        let getValueFunction = null;

        if (optgroup === "Numeric Attributes") {
            attributeMax = parseFloat($("#" + attributeName + "-sliderOutputMin").attr("max"));
            attributeMin = parseFloat($("#" + attributeName + "-sliderOutputMin").attr("min"));
            getValueFunction = getNodeAttribute;
        }

        else if (optgroup === "Centralities") {
            attributeMax = graph.properties[attributeName].max;
            attributeMin = graph.properties[attributeName].min;
            getValueFunction = getNodeProperty;
        }

        node.style("fill", function (d) {
            const attributeValue = getValueFunction(d, attributeName);
            if (attributeValue === "") {
                return forceProperties.colouring.network;
            }
            
            const resultValue = ((parseFloat(attributeValue) - attributeMin) / (attributeMax - attributeMin));
            const resultColour = pickHex(lowValueColour, highValueColour, resultValue);
            const lightness = fontLightness(resultColour);
            const node_text = $('#' + d.id + '_node_text');
            node_text.css("fill", 'hsl(0, 0%, ' + String(lightness) + '%)');
            return rgbObjectToString(resultColour);
        });
        link.style("stroke", 'white');
        return;
    }

    forceProperties.attributeColouring.enabled = false;
    updateNodeAndLinkColour(node, link);
}

const projectAttributeXAxis = function(selectElement) {
    const attributeName = selectElement.value;
    const { strength, enabled, x } = forceProperties.forceX;
    const forceName = "forceX";

    simulation.force(forceName)
        .strength(strength * enabled);

    if (attributeName !== "") {

        forceProperties.forceX.enabled = true;
        forceProperties.forceX.attribute = attributeName;
        
        const optgroup = selectElement.options[selectElement.selectedIndex].closest('optgroup').getAttribute('label');
        let attributeMax = null;
        let attributeMin = null;
        let getValueFunction = null;

        if (optgroup === "Attributes") {
            attributeMax = parseFloat($("#" + attributeName + "-sliderOutputMin").attr("max"));
            attributeMin = parseFloat($("#" + attributeName + "-sliderOutputMin").attr("min"));
            getValueFunction = getNodeAttribute;
        }

        else if (optgroup === "Centralities"){
            attributeMax = graph.properties[attributeName].max;
            attributeMin = graph.properties[attributeName].min;
            getValueFunction = getNodeProperty;
        }

        
        simulation.force(forceName)
            .x(function (d) {
                const attributeValue = getValueFunction(d, attributeName);
                if (attributeValue == "") {
                    return width / 2;
                }

                const resultXCoord = width * ((parseFloat(attributeValue) - attributeMin) / (attributeMax - attributeMin));
                return resultXCoord;
            });

        updateForces();
        return;
    }
    forceProperties.forceX.enabled = false;

    simulation.force(forceName)
        .x(width * x);

    updateForces();
}


const projectAttributeYAxis = function (selectElement) {
    const attributeName = selectElement.value;
    const { strength, enabled, y } = forceProperties.forceY;
    const forceName = "forceY";

    const getNodeAttribute = function (d, attributeName) { return d[attributeName]; };
    const getNodeProperty = function (d, attributeName) { return graph.properties[attributeName].values[d.id] };

    simulation.force(forceName)
        .strength(strength * enabled);

    if (attributeName !== "") {
        forceProperties.forceY.enabled = true;
        forceProperties.forceY.attribute = attributeName;
        const optgroup = selectElement.options[selectElement.selectedIndex].closest('optgroup').getAttribute('label');
        let attributeMax = null;
        let attributeMin = null;
        let getValueFunction = null;

        if (optgroup === "Attributes") {
            attributeMax = parseFloat($("#" + attributeName + "-sliderOutputMin").attr("max"));
            attributeMin = parseFloat($("#" + attributeName + "-sliderOutputMin").attr("min"));
            getValueFunction = getNodeAttribute;
        }

        else if (optgroup === "Centralities") {
            attributeMax = graph.properties[attributeName].max;
            attributeMin = graph.properties[attributeName].min;
            getValueFunction = getNodeProperty;
        }

        simulation.force(forceName)
            .y(function (d) {
                const attributeValue = getValueFunction(d, attributeName);
                if (attributeValue == "") {
                    return height / 2;
                }

                const resultYCoord = height - (height * ((parseFloat(attributeValue) - attributeMin) / (attributeMax - attributeMin)));
                return resultYCoord;
            });

        updateForces();
        return;
    }

    forceProperties.forceY.enabled = false;

    simulation.force(forceName)
        .y(height * y);

    updateForces();
    
}

const createDoubleSlider = function (sliderId, minValueId, maxValueId, minValue, maxValue, lowValue = minValue, highValue = maxValue) {
    $("#" + sliderId).slider({
        range: true,
        min: minValue,
        max: maxValue,
        values: [lowValue, highValue],
        step: 0.01,
        slide: function (event, ui) {
            $("#" + minValueId).val(ui.values[0]);
            $("#" + maxValueId).val(ui.values[1]);

            if (ui.handleIndex === 0) {
                filterByValue(ui, minValueId.split("-")[0], FilterCondition.lower, false);
            }
            else if (ui.handleIndex === 1) {
                filterByValue(ui, maxValueId.split("-")[0], FilterCondition.greater, true);
            }
        }
    });
    //$("#" + minValueId).val($("#" + sliderId).slider("values", 0));
    //$("#" + maxValueId).val($("#" + sliderId).slider("values", 1));

}


const closeAllRemodelPanels = function () {
    $('.remodel-attribute-panel.active-flex').removeClass('active-flex');
}

const expandRemodelPanel = function (e, remodelPanelId) {
    e.stopPropagation();
    closeAllToolbarPanels();
    closeAllRemodelPanels();
    $('#' + remodelPanelId).toggleClass('active-flex');
}

const fillAttributeTransform = function (attributeCheckboxDiv, dataRole) {
    const result = [];
    const searchString = "input[type='checkbox'][data-role='" + dataRole + "']:checked";
    const transformCheckboxes = $(attributeCheckboxDiv).find(searchString);
    for (const transformCheckbox of transformCheckboxes) {
        result.push(transformCheckbox.value);
    }

    return result;
}


const remodelNetwork = function (checkboxesDivId, algorithmSelectId, metricSelectId) {
    const attributeCheckboxDiv = document.getElementById(checkboxesDivId);
    const selectedAlgorithm = document.getElementById(algorithmSelectId).value;
    const selectedMetric = document.getElementById(metricSelectId).value;


    const remodelingCheckboxes = $(attributeCheckboxDiv).find("input[type='checkbox'][data-role='remodeling']:not(:checked)");
    const excludedAttributes = $.makeArray(remodelingCheckboxes.map((index, checkbox) => {
        return checkbox.value;
    }));


    const attributeTransform = {
        "normalize": [],
        "standardize": [],
        "distribution": []
    };

    attributeTransform.normalize = fillAttributeTransform(attributeCheckboxDiv, 'normalization');
    attributeTransform.standardize = fillAttributeTransform(attributeCheckboxDiv, 'standardization');
    attributeTransform.distribution = fillAttributeTransform(attributeCheckboxDiv, 'distribution');
    
    const networkRemodelParams =
    {
        "metric": {
            "name": selectedMetric,
            "params": []
            
            
        },
        "algorithm": {
            "name": selectedAlgorithm,
            "params": []
        }
    };
   
    switch (selectedMetric) {
        default:
            break;
        case 'GaussKernel':
            const metricParams = networkRemodelParams["metric"]["params"];
            const sigma = parseFloat(document.getElementById('sigma').value);
            metricParams.push(sigma);
            break;
    }
    
    switch (selectedAlgorithm) {
        default:
            break;
        case 'EpsilonKNN':
            const epsilonRadius = parseFloat(document.getElementById('epsilonRadius').value);
            const k = parseInt(document.getElementById('kNNmin').value);
            const algorithmParams = networkRemodelParams["algorithm"]["params"];
            algorithmParams.push(epsilonRadius);
            algorithmParams.push(k);
            break;
    }

    const nodes_string = JSON.stringify(graph.nodes);
    const attributes_string = JSON.stringify(graph.attributes);
    const excluded_attributes_string = JSON.stringify(excludedAttributes);
    const attribute_transform_string = JSON.stringify(attributeTransform);
    const network_remodel_params_string = JSON.stringify(networkRemodelParams);
    
    $.ajax({
        url: '/Home/RemodelNetwork',
        type: 'POST',
        //dataType: 'json',
        // It is important to set the content type
        // request header to application/json because
        // that's how the client will send the request
        //contentType: 'application/json',
        data: {
            nodes: nodes_string,
            attributes: attributes_string,
            excludedAttributes: excluded_attributes_string,
            attributeTransform: attribute_transform_string,
            networkRemodelParams: network_remodel_params_string
        },
        //cache: false,
        success: function (result) {
            const newNet = JSON.parse(result.newNetwork);
            graph.links = newNet;
            store.links = $.extend(true, {}, newNet);//newNet.map(a => { return { ...a }; });

            linkedByIndex = {};
            for (let l of graph.links) {
                const index = l.source + "," + l.target
                linkedByIndex[index] = 1;
            }


            updateLinks();
            requestCommunityDetection();
            updateLinkColour(link);
            calculateAllMetrics();
            resetSimulation();

        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(thrownError);
        }
    });
}

const changeNetworkNodeColour = function(colour) {
    forceProperties.colouring.network = colour;
    updateNodeAndLinkColour(node, link);
}

const changeNetworkBackgroundColour = function (colour) {
    forceProperties.colouring.background = colour;
    $('#network-background-rect.background').css("fill", colour);
}
