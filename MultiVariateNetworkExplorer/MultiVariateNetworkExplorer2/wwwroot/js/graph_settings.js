
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

    let value = parseFloat(input.value);
    const extremeValue = parseFloat(!minmax ? input.min : input.max);
    const filterSuffix = !minmax ? "_min" : "_max";
    const attributeFilterType = !minmax ? "low" : "high";
    if (filterCondition.booleanFunction(value, extremeValue)) {
        value = extremeValue;
        input.value = extremeValue;
    }

    const { nodeData: storeNodes, linkData: storeLinks } = dataStore;
    const { nodes: graphNodes, links: graphLinks } = currentGraph;
    const nodeFiltersAttributeName = "filters";
    const linkFilteredName = "filtered";

    for (let i = graphNodes.length - 1; i > -1; i--) {
        const n = graphNodes[i];
        const nodeId = n.id;
        const attributeValue = currentGraph.getNodeDataValue(nodeId, filteredAttributeName);
        if (attributeValue === "")
            continue;

        if (filterCondition.booleanFunction(attributeValue, value)) {
            if (!currentGraph.getNodeDataValue(n.id, nodeFiltersAttributeName)) {
                dataStore.addNewNodeAttribute(nodeId, nodeFiltersAttributeName, []);
                graphNodes.splice(i, 1);
                filterNodeList.push(nodeId);
            }

            const filters = currentGraph.getNodeDataValue(n.id, nodeFiltersAttributeName);
            if (!filters.includes(filteredAttributeName + filterSuffix)) {
                filters.push(filteredAttributeName + filterSuffix);
            }

        }
    }

    for (let i = graphLinks.length - 1; i > -1; i--) {
        const l = graphLinks[i];
        const source = currentGraph.getLinkDataValue(l.id, "source");
        const target = currentGraph.getLinkDataValue(l.id, "target");

        if (filterNodeList.includes(source) || filterNodeList.includes(target)) {
            dataStore.addNewLinkAttribute(l.id, linkFilteredName, true);
            graphLinks.splice(i, 1);          
        }
    }

    for (const [n, nodeData] of Object.entries(storeNodes)) {
        const { [filteredAttributeName]: filAttrVal } = nodeData;
        if (filAttrVal === "")
            continue;

        const { filters } = nodeData;
        if (!filterCondition.booleanFunction(filAttrVal, value) && filters) {
            if (filters.length > 0) {
                for (let i = filters.length - 1; i > -1; i--) {
                    const filterName = filters[i];
                    if (filterName === `${filteredAttributeName}${filterSuffix}`) {
                        filters.splice(i, 1);
                    }
                }

                if (filters.length === 0) {
                    const returningNode = {
                        "id": n
                    };
                    graphNodes.push(returningNode);
                    filterNodeList.splice(filterNodeList.indexOf(n), 1);
                    delete nodeData.filters;
                }
            }
        }
    }
    

    for (const [id, l] of Object.entries(storeLinks)) { 
        const { source, target } = l;
        if (!(filterNodeList.includes(source) || filterNodeList.includes(target)) && l.filtered) {
            const returningLink = {
                "id": id,
                "source": source,
                "target": target
            };
            graphLinks.push(returningLink);
            dataStore.removeLinkAttribute(id, linkFilteredName)
        } 
    };

    updateNodesAndLinks();
    startSimulation();

}

const filterByCategory = function (filteredAttributeName, category, checked) {
    const { nodeData: storeNodes, linkData: storeLinks } = dataStore;
    const { nodes: graphNodes, links: graphLinks } = currentGraph;
    const nodeFiltersAttributeName = "filters";
    const linkFilteredName = "filtered";


    if (!checked) {
        for (let i = graphNodes.length - 1; i > -1; i--) {
            const n = graphNodes[i];
            const nodeId = n.id;
            const attributeValue = currentGraph.getNodeDataValue(nodeId, filteredAttributeName);

            if (attributeValue === category) {
                if (!currentGraph.getNodeDataValue(n.id, nodeFiltersAttributeName)) {
                    dataStore.addNewNodeAttribute(nodeId, nodeFiltersAttributeName, []);
                    graphNodes.splice(i, 1);
                    filterNodeList.push(nodeId);
                }

                const filters = currentGraph.getNodeDataValue(n.id, nodeFiltersAttributeName);
                if (!filters.includes(`${filteredAttributeName}_${category}`)) {
                    filters.push(`${filteredAttributeName}_${category}`);
                }
            }
        }



        for (let i = graphLinks.length - 1; i > -1; i--) {
            const l = graphLinks[i];
            const source = currentGraph.getLinkDataValue(l.id, "source");
            const target = currentGraph.getLinkDataValue(l.id, "target");

            if (filterNodeList.includes(source) || filterNodeList.includes(target)) {
                dataStore.addNewLinkAttribute(l.id, linkFilteredName, true);
                graphLinks.splice(i, 1);
            }
        }
        updateNodesAndLinks();
        startSimulation();
        return;
    }

    for (const [n, nodeData] of Object.entries(storeNodes)) {
        const { [filteredAttributeName]: filAttrVal } = nodeData;
        if (filAttrVal === "")
            return;
        
        const { filters } = nodeData;
        if (filAttrVal === category && filters) {
            if (filters.length > 0) {
                for (let i = filters.length - 1; i > -1; i--) {
                    const filterName = filters[i];
                    if (filterName === `${filteredAttributeName}_${category}`) {
                        filters.splice(i, 1);
                    }
                }

                if (filters.length === 0) {
                    const returningNode = {
                        "id": n
                    };
                    graphNodes.push(returningNode);
                    filterNodeList.splice(filterNodeList.indexOf(n), 1);
                    delete nodeData.filters;
                }
            }
        }
    };

    for (const [id, l] of Object.entries(storeLinks)) { 
        const { source, target } = l;
        if (!(filterNodeList.includes(source) || filterNodeList.includes(target)) && l.filtered) {
            const returningLink = {
                "id": id,
                "source": source,
                "target": target
            };
            graphLinks.push(returningLink);
            dataStore.removeLinkAttribute(id, linkFilteredName)
        } 
    };

    updateNodesAndLinks();
    startSimulation();
   
}

const handleForceEnablement = function(value, force, forceUpdateDelegate){
    currentGraph.setForcePropertyValue(force, "enabled", value)
    forceUpdateDelegate();
    startSimulation();
}

const handleForceChange = function (value, sliderOutputId, force, property, forceUpdateDelegate) {
    d3.select('#' + sliderOutputId).text(value);
    currentGraph.setForcePropertyValue(force, property, Number(value))
    forceUpdateDelegate();
    startSimulation();
}

const getNodeAttribute = function (d, attributeName) {
    return currentGraph.getNodeDataValue(d.id, attributeName);
};
const getNodeProperty = function (d, attributeName) {
    return currentGraph.getPropertyValue(d.id, attributeName);;
};

const enableNodeLabels = function () {
    nodeText.classed('invisible', !nodeVisualProperties.labels.enabled);
}

const setNodeLabel = function (selectElement) {
    const attributeName = selectElement.value;
    const optgroup = selectElement.options[selectElement.selectedIndex].closest('optgroup');
    nodeVisualProperties.labels.attribute = attributeName;
    if (attributeName === "") {
        nodeText.style("display", "none");
        return;
    }

    nodeText.style("display", "block");

    let getValueFunction = getNodeAttribute;

    if (attributeName === "id") {
        nodeText.text(function (d) {
            return d.id;
        });
        return;
    }

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
    const defaultRadius = currentGraph.getForcePropertyValue(Graph.forceNames.collide, "radius");
    nodeVisualProperties.sizing.attribute = attributeName;

    if (attributeName !== "") {
        nodeVisualProperties.sizing.enabled = true;
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
            attributeMax = currentGraph.getPropertyAttributeValue(attributeName, "max");
            attributeMin = currentGraph.getPropertyAttributeValue(attributeName, "min");
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

    nodeVisualProperties.sizing.enabled = false;
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

const changeAttributeGradientColouringFromSettings = function (attributeSelectId, colourListId) {
    const attributeSelect = document.getElementById(attributeSelectId);
    const optgroup = attributeSelect.options[attributeSelect.selectedIndex].closest('optgroup').getAttribute('label');
    const attributeName = attributeSelect.value;

    let attributeMax = null;
    let attributeMin = null;
    let getValueFunction = null;

    if (optgroup === "Numeric Attributes") {
        attributeMax = parseFloat($("#" + attributeName + "-sliderOutputMin").attr("max"));
        attributeMin = parseFloat($("#" + attributeName + "-sliderOutputMin").attr("min"));
        getValueFunction = getNodeAttribute;
    }

    else {
        attributeMax = currentGraph.getPropertyAttributeValue(attributeName, "max");
        attributeMin = currentGraph.getPropertyAttributeValue(attributeName, "min");
        getValueFunction = getNodeProperty;
    }

    const gradientStopColours = d3.selectAll(`#attribute-node-colouring-preview-gradient stop`);

    const colourObject = [];
    gradientStopColours.each(function () {
        const colour = d3.select(this).attr("stop-color");
        const offset = d3.select(this).attr("offset");

        const attributeRange = attributeMax - attributeMin;
        const valueThreshold = attributeMin + (attributeRange * offset);

        colourObject.push({
            value: valueThreshold,
            colour: hexToRgb(colour)
        });

    })

    nodeVisualProperties.colouring.lastColouringType = "gradient";
    setAttributeGradientColouring(attributeName, optgroup, getValueFunction, colourObject, attributeMin, attributeMax);
}

const saveAttributeGradientColouring = function (attributeSelectId, lowColourId, highColourId) {
    const attributeSelect = document.getElementById(attributeSelectId);
    const optgroup = attributeSelect.options[attributeSelect.selectedIndex].closest('optgroup').getAttribute('label');
    const attributeName = attributeSelect.value;

    const lowColour = document.getElementById(lowColourId);
    const highColour = document.getElementById(highColourId);
}

const getGradientColour = function (colourObject, attributeValue, attributeMin, attributeMax) {

    const firstColour = colourObject[0];
    if (attributeValue <= firstColour.value) {
        return firstColour.colour;
    }

    let lowValueColourRGB = null;
    let highValueColourRGB = null;
    for (let i = 1; i < colourObject.length; i++) {
        if (attributeValue <= colourObject[i].value) {
            lowValueColourRGB = colourObject[i - 1].colour;
            highValueColourRGB = colourObject[i].colour;
            const resultValue = ((parseFloat(attributeValue) - attributeMin) / (attributeMax - attributeMin));
            const resultColour = pickHex(lowValueColourRGB, highValueColourRGB, resultValue);
            return resultColour;
        }
    }

    const lastColour = colourObject[colourObject.length - 1];
    return lastColour.colour;
    
}

const setAttributeGradientColouring = function (attributeName, optgroup, valueFunction, colourObject, attributeMin, attributeMax) {
    node.style("fill", function (d) {
        const attributeValue = valueFunction(d, attributeName);
        if (attributeValue === "") {
            return nodeVisualProperties.colouring.network;
        }

        const finalColour = getGradientColour(colourObject, attributeValue, attributeMin, attributeMax);
        const lightness = fontLightness(finalColour);
        const node_text = $('#' + d.id + '_node_text');
        node_text.css("fill", 'hsl(0, 0%, ' + String(lightness) + '%)');
        return rgbObjectToString(finalColour);
    });
    link.style("stroke", nodeVisualProperties.colouring.network);
}


const updateGradientLegend = function (legendDivId, colourListId) {
    const legendSvg = d3.select(`#${legendDivId}`)
        .select("svg");
    const linearGradient = legendSvg.select("linearGradient");

    const jColourListInputs = $( `#${colourListId} input` );
    const colourCount = jColourListInputs.length;


    const colourData = [];
    let offset = 0;
    const offsetIncrement = 1.0 / (colourCount - 1);
    jColourListInputs.each(function() {
        const colour = $( this ).val();
        colourData.push({
            "offset": offset,
            "colour": colour
        });
        offset += offsetIncrement;
    });

    colourData[colourData.length - 1].offset = 1;
    
    const stopColours = linearGradient
        .html("")
        .selectAll("stop")
        .data(colourData)
        .enter()
        .append("stop")
        .attr("offset", function (d) {
            return d.offset;
        })
        .attr("stop-color", function (d) {
            return d.colour;
        });

    updateGradientLegendPointers(legendSvg, stopColours);
}

const stopColourPolygonDragged = function (d, i) {
    const { dx } = d3.event;
    d.x += dx;
    d.x = Math.max(10, Math.min(d.x, 410));
    const { stopIndex, previousPointerData: prev, nextPointerData: next } = d;
    
    const colourInputs = document.querySelectorAll("#numerical-colour-list input");
    if (dx < 0 && prev !== null) {
        if (d.x < prev.x) {
            const { previousPointerData: prevPrev } = prev;
            const leftColour = colourInputs[prev.stopIndex].value;
            const rightColour = colourInputs[stopIndex].value;
            colourInputs[stopIndex].value = leftColour;
            colourInputs[prev.stopIndex].value = rightColour;

            [d.stopIndex, d.previousPointerData.stopIndex] = [d.previousPointerData.stopIndex, d.stopIndex];

            if (prevPrev !== null) {
                prevPrev.nextPointerData = d;
            }
            d.previousPointerData = prevPrev;
            d.nextPointerData = prev;

            prev.previousPointerData = d;
            prev.nextPointerData = next;

            if (next !== null) {
                next.previousPointerData = prev;
            }

            const stopColour = document.querySelector(`#attribute-node-colouring-preview stop:nth-child(${prev.stopIndex + 1})`);
            stopColour.setAttribute("offset", (prev.x - 10) / 400.0);
        }
    }

    if (dx > 0 && next !== null) {
        if (d.x > next.x) {
            const { nextPointerData: nextNext } = next;

            const leftColour = colourInputs[stopIndex].value;
            const rightColour = colourInputs[next.stopIndex].value;
            colourInputs[stopIndex].value = rightColour;
            colourInputs[next.stopIndex].value = leftColour;

            [d.stopIndex, d.nextPointerData.stopIndex] = [d.nextPointerData.stopIndex, d.stopIndex];

            if (nextNext !== null) {
                nextNext.previousPointerData = d;
            }

            d.nextPointerData = nextNext;
            d.previousPointerData = next;

            next.nextPointerData = d;
            next.previousPointerData = prev;
            

            if (prev !== null) {
                prev.nextPointerData = next;
            }

            const stopColour = document.querySelector(`#attribute-node-colouring-preview stop:nth-child(${next.stopIndex + 1})`);
            stopColour.setAttribute("offset", (next.x - 10) / 400.0);
        }
    }
    
    
    d3.select(this).attr("transform", `translate(${d.x}, 0)`);
}

const stopColourPolygonDragEnded = function (d) {
    const { dx } = d3.event;
    const legendDivId = "attribute-node-colouring-preview";
    const stops = document.querySelectorAll(`#${legendDivId} linearGradient stop`);

    
    const newStopOffset = (d.x - 10) / 400.0;
    stops[d.stopIndex].setAttribute("offset", newStopOffset);

    const { previousPointerData: prev, nextPointerData: next } = d;
    if (prev !== null) {
        const newPrevStopOffset = (prev.x - 10) / 400.0;
        stops[prev.stopIndex].setAttribute("offset", newPrevStopOffset);
    }

    if (next !== null) {
        const newNextStopOffset = (next.x - 10) / 400.0;
        stops[next.stopIndex].setAttribute("offset", newNextStopOffset);
    }
    
    updateGradientColour(legendDivId, "numerical-colour-list")
}

const updateGradientColour = function () {
    const linearGradient = d3.select(`#attribute-node-colouring-preview`)
        .select("svg").select("linearGradient");

    const jColourListInputs = document.querySelectorAll(`#numerical-colour-list input`);

    linearGradient.selectAll("stop")
        .attr("stop-color", function (d, i) {
            return jColourListInputs[i].value;
        })
}


const updateGradientLegendPointers = function (legendSvg, stopColours) {
    legendSvg.select("#stop-colour-pointers").remove();
    const gPointers = legendSvg
        .append("g")
        .attr("transform", "translate(0,30)")
        .attr("id", "stop-colour-pointers");

    const pointerData = [];
    stopColours.each(function (d, i) {
        const x = Math.floor(d.offset * 400) + 10;
        pointerData.push(
            {
                'x': x,
                "stopIndex": i,
            });
    });

    pointerData[pointerData.length - 1].x = 410;

    for (let i = 0; i < pointerData.length; i++) {
        const previousPointerData = i > 0 ? pointerData[i - 1] : null;
        const nextPointerData = i < (pointerData.length - 1) ? pointerData[i + 1] : null;
        pointerData[i].previousPointerData = previousPointerData;
        pointerData[i].nextPointerData = nextPointerData;
    }


    gPointers.selectAll("polygon")
        .data(pointerData)
        .enter()
        .append("polygon")
        .attr("points", function (d) { return `0,15 -7,0 7,0`; })
        .attr("transform", function (d) { return `translate(${d.x}, 0)` })
        .call(d3.drag()
            .on("drag", stopColourPolygonDragged)
            .on("end", stopColourPolygonDragEnded));

    
}

const updateGradientLegendAxis = function (attributeSelectId) {
    const legendSvg = d3.select(`#attribute-node-colouring-preview svg`)
    const attribute = document.getElementById(attributeSelectId).value;

    const attributeValues = currentGraph.getAllAttributeValues(attribute);
    const xMin = d3.min(attributeValues);
    const xMax = d3.max(attributeValues);

    const axis = createLinearAxis(xMin, xMax, 10, 410);
    const axisLeg = d3.axisBottom(axis);

    legendSvg.select("#gradient-legend-axis").remove();
    legendSvg
        .append("g")
        .attr("transform", "translate(0, 60)")
        .attr("id", "gradient-legend-axis")
        .call(axisLeg);
}

const addGradientListColour = function (legendDivId, value, idPrefix, colourListId) {
    const colourList = d3.select(`#${colourListId}`);
    const inputColour = addListColour(value, idPrefix, colourList);
    inputColour
        .on("change", function () { updateGradientColour(legendDivId, colourListId); });
    updateGradientLegend(legendDivId, colourListId);
}

const addListColour = function (value, idPrefix, colourList) {
    const valueWithoutWhitespaces = removeSpacesAndCommas(value);
    const id = `${idPrefix}-colour-${valueWithoutWhitespaces}`;
    const newDistinctColourRow = colourList.append("li")
        .append("div")
        .classed("colour-row-list", true);
    newDistinctColourRow.append("label")
        .attr("title", value)
        .attr("for", id)
        .html(value);
    return newDistinctColourRow.append("input")
        .attr("type", "color")
        .attr("id", id)
        .property("value", groupColours(value));

}

const randomColour = function (brightness) {
    function randomChannel(brightness) {
        var r = 255 - brightness;
        var n = 0 | ((Math.random() * r) + brightness);
        var s = n.toString(16);
        return (s.length == 1) ? '0' + s : s;
    }
    return '#' + randomChannel(brightness) + randomChannel(brightness) + randomChannel(brightness);
}

const randomizeListColours = function (colourListId) {
    d3.selectAll(`#${colourListId} input`)
        .prop(value, randomColour(0));
}



const changeAttributeCategoryColouringList = function (attributeSelectId, colourListId) {
    const attributeName = document.getElementById(attributeSelectId).value;

    if (attributeName === "") {
        return;
    }

    const colourList = d3.select(`#${colourListId}`);

    const attributeDistinctValues = currentGraph.getDistinctValues(attributeName);

    colourList.html("");
    for (const value of attributeDistinctValues) {
        addListColour(value, "category", colourList);
    }
}

//TO DO - Get attribute name and colour listin form of object from settings tab
const changeAttributeCategoryColouringFromSettings = function (attributeSelectId, colourListId) {
    const attributeName = document.getElementById(attributeSelectId).value;
    const colourList = document.getElementById(colourListId);

    const colourObject = {};
    for (const colourLI of colourList.children) {
        const distinctValue = colourLI.querySelector("label").innerHTML;
        const colour = colourLI.querySelector("input").value;
        colourObject[distinctValue] = colour;
    }
    nodeVisualProperties.colouring.lastColouringType = "categorical";
    setAttributeCategoryColouring(attributeName, colourObject);
}


const saveAttributeCategoryColouring = function (attributeSelectId, colourListId) {
    
}


//TO DO - Get node colour based on attribute category
const setAttributeCategoryColouring = function (attributeName, colourObject) {
    node.style("fill", function (d) {
        const attributeValue = getNodeAttribute(d, attributeName);
        if (attributeValue === "") {
            return nodeVisualProperties.colouring.network;
        }
        const resultColour = hexToRgb(colourObject[attributeValue]);
        const lightness = fontLightness(resultColour);
        const node_text = $('#' + d.id + '_node_text');
        node_text.css("fill", 'hsl(0, 0%, ' + String(lightness) + '%)');
        return rgbObjectToString(resultColour);
    });
    link.style("stroke", function (l) {
        const { id } = l.source;
        const attributeValue = currentGraph.getNodeDataValue(id, attributeName);
        if (isNullOrEmpty(attributeValue)) {
            return 
        }

        return isNullOrEmpty(attributeValue) ?
            nodeVisualProperties.colouring.network :
            colourObject[attributeValue];
    });
}


const setPartitionColouring = function (colourListId) {
    const colourObject = contructColourObjectFromList(colourListId);

    nodeVisualProperties.colouring.lastColouringType = "partition";

    node.style("fill", function (d) {
        const { id } = d;
        const partition = currentGraph.getPartition(id);
        if (partition === "") {
            return nodeVisualProperties.colouring.network;
        }

        const resultColour = hexToRgb(colourObject[partition]);
        const lightness = fontLightness(resultColour);
        const node_text = $('#' + id + '_node_text');
        node_text.css("fill", 'hsl(0, 0%, ' + String(lightness) + '%)');
        return rgbObjectToString(resultColour);
    });
    link.style("stroke", function (l) {
        const { id } = l.source;
        const partition = currentGraph.getPartition(id);
        if (partition === "") {
            return nodeVisualProperties.colouring.network;
        }

        return colourObject[partition];

    });

    const boxplots = d3.selectAll("#partition-metric-boxplot-graph-container svg");
    updateBoxplotColour(boxplots, colourObject);
}

const contructColourObjectFromList = function (colourListId) {
    const colourList = document.getElementById(`${colourListId}`);

    const colourObject = {};
    for (const colourLI of colourList.children) {
        const distinctPartition = colourLI.querySelector("label").innerHTML;
        const colour = colourLI.querySelector("input").value;
        colourObject[distinctPartition] = colour;
    }

    return colourObject;
}

const changeClassColouringFromSettings = function (attributeSelectId, colourListId, colourNodes = false) {
    const attributeName = document.getElementById(attributeSelectId).value;
    const colourList = document.getElementById(colourListId);

    const colourObject = {};
    for (const colourLI of colourList.children) {
        const distinctValue = colourLI.querySelector("label").innerHTML;
        const colour = colourLI.querySelector("input").value;
        colourObject[distinctValue] = colour;
    }

    setClassColouring(attributeName, colourObject, colourNodes);

}

const setClassColouring = function (attributeName, colourObject, colourNodes) {
    const rects = d3.selectAll("#partition-metric-mcc-graph-container rect");

    rects.style("fill", (d) => { return colourObject[d.className]; });

    if (colourNodes) {
        node.style("fill", function (d) {
            const { id } = d;
            const partition = currentGraph.getNodeDataValue(id, attributeName);
            if (partition === "") {
                return nodeVisualProperties.colouring.network;
            }

            const resultColour = hexToRgb(colourObject[partition]);
            //const lightness = fontLightness(resultColour);
            //const node_text = $('#' + id + '_node_text');
            //node_text.css("fill", 'hsl(0, 0%, ' + String(lightness) + '%)');
            return rgbObjectToString(resultColour);
        });
        link.style("stroke", function (l) {
            const { id } = l.source;
            const partition = currentGraph.getNodeDataValue(id, attributeName);
            if (partition === "") {
                return nodeVisualProperties.colouring.network;
            }

            return colourObject[partition];

        });
    }
    
}

const setDefaultNodeColour = function (nodes, colour) {
    nodes.style("fill", function (d) {
        const { id } = d;
        //const lightness = fontLightness(colour);
        //const text = $('#' + id + '_node_text');
        //text.css("fill", 'hsl(0, 0%, ' + String(lightness) + '%)')
        return colour;
    });
}

const setDefaultLinkColour = function (links, colour) {
    links.style("stroke", colour);
}

const setDefaultNodeAndLinkColour = function (nodes, links) {
    const defaultNodeColour = document.getElementById("network-colour-input").value;
    setDefaultNodeColour(nodes, defaultNodeColour);
    setDefaultLinkColour(links, defaultNodeColour);
}

const changeNetworkNodeColour = function (colourInputId) {
    const colour = $(`#${colourInputId}`).val();
    nodeVisualProperties.colouring.network = colour;
    setDefaultNodeAndLinkColour(node, link);
}

const changeNetworkBackgroundColour = function (colourInputId) {
    const colour = $(`#${colourInputId}`).val();
    nodeVisualProperties.colouring.background = colour;
    $('#network-background-rect.background').css("fill", colour);
}

const projectAttributeXAxis = function(selectElement) {
    const attributeName = selectElement.value;

    if (attributeName !== "") {

        const optgroup = selectElement.options[selectElement.selectedIndex].closest('optgroup').getAttribute('label');
        let attributeMax = null;
        let attributeMin = null;

        if (optgroup === "Attributes") {
            attributeMax = parseFloat($("#" + attributeName + "-sliderOutputMin").attr("max"));
            attributeMin = parseFloat($("#" + attributeName + "-sliderOutputMin").attr("min"));
            //node.each(function (d) {
            //    const attributeValue = currentGraph.getNodeDataValue(d.id, attributeName);

            //    if (attributeValue == "") {
            //        d.fx =width / 2;
            //        return;
            //    }
            //    const resultXCoord = width * ((parseFloat(attributeValue) - attributeMin) / (attributeMax - attributeMin)) + 1;
            //    d.fx = resultXCoord;
            //})
           
            currentGraph.updateXForceAttribute(attributeName, attributeMax, attributeMin);
        }

        else if (optgroup === "Centralities"){
            attributeMax = graph.properties[attributeName].max;
            attributeMin = graph.properties[attributeName].min;
            currentGraph.updateXForceProperty(attributeName);
        }
        startSimulation();
        return;
    }

    currentGraph.setDefaultXForce();
    startSimulation();
}


const projectAttributeYAxis = function (selectElement) {
    const attributeName = selectElement.value;

    if (attributeName !== "") {

        const optgroup = selectElement.options[selectElement.selectedIndex].closest('optgroup').getAttribute('label');
        let attributeMax = null;
        let attributeMin = null;

        if (optgroup === "Attributes") {
            attributeMax = parseFloat($("#" + attributeName + "-sliderOutputMin").attr("max"));
            attributeMin = parseFloat($("#" + attributeName + "-sliderOutputMin").attr("min"));
            //node.each(function (d) {
            //    const attributeValue = currentGraph.getNodeDataValue(d.id, attributeName);
            //    if (attributeValue == "") {
            //        d.fy = height / 2;
            //    }

            //    const resultYCoord = height - (height * ((parseFloat(attributeValue) - attributeMin) / (attributeMax - attributeMin)));
            //    d.fy = resultYCoord;
            //});
            
            currentGraph.updateYForceAttribute(attributeName, attributeMax, attributeMin);
        }

        else if (optgroup === "Centralities") {
            attributeMax = graph.properties[attributeName].max;
            attributeMin = graph.properties[attributeName].min;
            currentGraph.updateYForceProperty(attributeName);
        }

        startSimulation();
        return;
    }
    
    currentGraph.setDefaultYForce();
    startSimulation();
}


const createDoubleSlider = function (sliderId, attributeName, minValueId, maxValueId, minValue, maxValue, lowValue = minValue, highValue = maxValue) {
    $("#" + sliderId).slider({
        range: true,
        min: minValue,
        max: maxValue,
        values: [lowValue, highValue],
        step: 0.01,
        stop: function (event, ui) {
            const minValueElem = document.getElementById(minValueId);
            const maxValueElem = document.getElementById(maxValueId);
            minValueElem.value = ui.values[0];
            maxValueElem.value = ui.values[1];

            if (ui.handleIndex === 0) {
                filterByValue(minValueElem, attributeName, lower, false);
            }
            else if (ui.handleIndex === 1) {
                filterByValue(maxValueElem, attributeName, greater, true);
            }
        }
    });

}


