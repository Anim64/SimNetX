const defaultNodeColour = "#ffffff";
let visualSettings = {
    //mono, gradient, category, partition
    currentColourSetting: "partition",
    monoColour: "#ffffff",
    backgroundColour:"#000000",
    gradientColour: {
        currentFeature: "",
        features: {},
        centralities: {}
    },
    categoryColour: {
        currentLabel: "",
        labels: {}
    },
    partitionColour: {},
    currentLabel: "id",
    currentNodeSize: ""
}

const initVisualSettings = function () {
    const { num: numAttributes = [], cat: catAttributes = [] } = currentGraph.attributes;
    
    //Add gradient colours in the page list according to initial selected feature
    const gradientColourListId = 'numerical-colour-list';
    const initialGradientColourCount = 3;
    gradientColourList = ['#0000FF', '#FF9933', '#FFFFFF'];
    for (let i = 0; i < initialGradientColourCount; i++) {
        addGradientListColour('attribute-node-colouring-preview', '', gradientColourList[i], gradientColourListId);
    }
    updateGradientLegendAxis('attribute-node-colouring');
    updateGradientLegend('attribute-node-colouring-preview', gradientColourListId);

    //Init feature gradient colours
    if (numAttributes) {
        visualSettings.gradientColour.currentFeature = numAttributes[0];
    }
    for (const feature of numAttributes) {
        //blue, orange and white are initial colours
        const colourObject = [];
        const featureMax = currentGraph.max(feature);
        const featureMin = currentGraph.min(feature);
        const featureRange = featureMax - featureMin;
        
        for (const [i, colour] of gradientColourList.entries()) {
            const valueThreshold = featureMin + (featureRange * (i * (1.0 / (gradientColourList.length - 1))));
            colourObject.push({
                value: valueThreshold,
                colour: colour
            });
        }

        visualSettings.gradientColour.features[feature] = colourObject;
    }
    

    

    
    //Init category colours
    if (catAttributes) {
        visualSettings.categoryColour.currentLabel = catAttributes[0];
    }

    for (const label of catAttributes) {
        const labelDistinctValues = currentGraph.getDistinctValues(label);
        visualSettings.categoryColour.labels[label] = {};
        for (const value of labelDistinctValues) {
            visualSettings.categoryColour.labels[label][value] = groupColours(value);
        }
    }
    changeAttributeCategoryColouringList('categorical-attribute-node-colouring', 'categorical-colour-list');

    //Init partition colours
    const partitionColourList = d3.select("#partition-colour-list").html("");
    const distinctPartitions = currentGraph.getDistinctPartitions();
    for (const partition of distinctPartitions) {
        visualSettings.partitionColour[partition] = addListColour(partition, groupColours(partition), "partition", partitionColourList)
            .property("value");
    }

}

/************************Monochrome colour section**************************/
const setDefaultNodeColour = function (nodes, colour) {
    nodes.style("fill", function (d) {
        const { id } = d;
        const lightness = fontLightness(colour);
        const text = $('#' + id + '_node_text');
        text.css("fill", 'hsl(0, 0%, ' + String(lightness) + '%)')
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
    visualSettings.currentColourSetting = "mono";
    visualSettings.monoColour = colour;
    setDefaultNodeAndLinkColour(node, link);
}

//*************************Background colour section**********************************/

const changeNetworkBackgroundColour = function (colourInputId) {
    const colour = $(`#${colourInputId}`).val();
    visualSettings.backgroundColour = colour;
    $('#network-background-rect.background').css("fill", colour);
}

//********************************Node label section**********************************/

const enableNodeLabels = function () {
    nodeText.classed('invisible', !nodeVisualProperties.labels.enabled);
}

const setNodeLabel = function (selectElement) {
    const attributeName = selectElement.value;
    const optgroup = selectElement.options[selectElement.selectedIndex].closest('optgroup');
    visualSettings.currentLabel = attributeName;
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

//************************Gradient colouring section**************************************
const changeAttributeGradientColouringFromSettings = function (attributeSelectId, colourListId) {
    const attributeSelect = document.getElementById(attributeSelectId);
    const optgroup = attributeSelect.options[attributeSelect.selectedIndex].closest('optgroup').getAttribute('label');
    const attributeName = attributeSelect.value;

    let attributeMax = null;
    let attributeMin = null;
    let getValueFunction = null;
    let attributePropertyName = null;
    if (optgroup === "Attributes") {
        attributeMax = currentGraph.max(attributeName);
        attributeMin = currentGraph.min(attributeName);
        getValueFunction = getNodeAttribute;
        attributePropertyName = "features";
    }

    else {
        attributeMax = currentGraph.getPropertyAttributeValue(attributeName, "max");
        attributeMin = currentGraph.getPropertyAttributeValue(attributeName, "min");
        getValueFunction = getNodeProperty;
        attributePropertyName = "centralities";
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
            colour: /*hexToRgb(colour)*/colour
        });

    })

    visualSettings.currentColourSetting = "gradient";
    visualSettings.gradientColour[attributePropertyName][attributeName] = colourObject;
    visualSettings.gradientColour.currentFeature = attributeName;
    setAttributeGradientColouring(attributeName, optgroup, getValueFunction, colourObject, attributeMin, attributeMax);
}



const setAttributeGradientColouring = function (attributeName, optgroup, valueFunction, colourObject, attributeMin, attributeMax) {
    node.style("fill", function (d) {
        const attributeValue = valueFunction(d, attributeName);
        if (attributeValue === "" || attributeValue === null) {
            return defaultNodeColour;
        }

        const finalColour = getGradientColour(colourObject, attributeValue, attributeMin, attributeMax);
        const lightness = fontLightness(finalColour);
        const node_text = $('#' + d.id + '_node_text');
        node_text.css("fill", 'hsl(0, 0%, ' + String(lightness) + '%)');
        return rgbObjectToString(finalColour);
    });
    link.style("stroke", defaultNodeColour);
}


const updateGradientLegend = function (legendDivId, colourListId) {
    const legendSvg = d3.select(`#${legendDivId}`)
        .select("svg");
    const linearGradient = legendSvg.select("linearGradient");

    const jColourListInputs = $(`#${colourListId} input`);
    const colourCount = jColourListInputs.length;


    const colourData = [];
    let offset = 0;
    const offsetIncrement = 1.0 / (colourCount - 1);
    jColourListInputs.each(function () {
        const colour = $(this).val();
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

const updateGradientColourList = function (featureSelectId) {
    const featureSelect = document.getElementById(featureSelectId)
    const optgroup = featureSelect.options[featureSelect.selectedIndex].closest('optgroup').getAttribute('label');
    const feature = featureSelect.value;
    const featureList = optgroup === "Attributes" ? visualSettings.gradientColour.features : visualSettings.gradientColour.centralities;
    d3.select("#numerical-colour-list").html("");
    for (const threshold of featureList[feature]) {
        addGradientListColour("attribute-node-colouring-preview", threshold.value.toString(), threshold.colour, "numerical-colour-list")
    }

}

const addGradientListColour = function (legendDivId, label, colour, colourListId) {
    const colourList = d3.select(`#${colourListId}`);
    const idPrefix = colourList.selectAll("li").size();
    if (idPrefix >= 6) {
        return;
    }
    const inputColour = addListColour(label, colour, idPrefix, colourList);
    inputColour
        .on("change", function () { updateGradientColour(legendDivId, colourListId); });
}

//**************Category colouring section*********************
const changeAttributeCategoryColouringList = function (attributeSelectId, colourListId) {
    const attributeName = document.getElementById(attributeSelectId).value;

    if (attributeName === "") {
        return;
    }

    const colourList = d3.select(`#${colourListId}`);

    colourList.html("");

    if (!visualSettings.categoryColour.labels[attributeName]) {
        visualSettings.categoryColour.currentLabel = attributeName;
        for (const label of currentGraph.attributes.cat) {
            const labelDistinctValues = currentGraph.getDistinctValues(label);
            visualSettings.categoryColour.labels[label] = {};
            for (const value of labelDistinctValues) {
                visualSettings.categoryColour.labels[label][value] = groupColours(value);
            }
        }
    }
    
    for (const [value, colour] of Object.entries(visualSettings.categoryColour.labels[attributeName])) {
        addListColour(value, colour, "category", colourList);
    }
}

//TO DO - Get attribute name and colour listin form of object from settings tab
const changeAttributeCategoryColouringFromSettings = function (attributeSelectId, colourListId) {
    const attributeName = document.getElementById(attributeSelectId).value;
    const colourObject = contructColourObjectFromList(colourListId);
    visualSettings.currentColourSetting = "category";
    visualSettings.categoryColour.currentLabel = attributeName;
    visualSettings.categoryColour.labels[attributeName] = colourObject;
    
    setAttributeCategoryColouring(attributeName, colourObject);
}

const setAttributeCategoryColouring = function (attributeName, colourObject) {
    node.style("fill", function (d) {
        const attributeValue = getNodeAttribute(d, attributeName);
        if (attributeValue === "") {
            return visualSettings.monoColour;
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
            visualSettings.monoColour:
            colourObject[attributeValue];
    });

    const rects = d3.selectAll("#partition-metric-mcc-graph-container rect");

    rects.style("fill", (d) => {
        return colourObject[d.x];
    });

}

//*************************************Partition colouring section**********************************/
const setPartitionColouring = function (colourListId) {
    const colourObject = contructColourObjectFromList(colourListId);

    visualSettings.currentColourSetting = "partition";
    visualSettings.partitionColour = colourObject;

    d3.selectAll(".selection-panel")
        .style("background-color", function (d) {
            return colourObject[d.id];
        });

    node.style("fill", function (d) {
        const { id } = d;
        const partition = currentGraph.getPartition(id);
        if (partition === "") {
            return defaultNodeColour;
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
            return defaultNodeColour;
        }

        return colourObject[partition];

    });

    const attributeBoxplots = d3.selectAll("#partition-metric-attribute-boxplot-graph-container svg");
    updateBoxplotColour(attributeBoxplots, colourObject);

    const partitionBoxplots = d3.selectAll("#partition-metric-partition-boxplot-graph-container svg");
    partitionBoxplots.each(function (d) {
        updateBoxplotColour(d3.select(this), colourObject[d.id]);
    })

}

const updatePartitionColours = function () {
    for (const partition of selectionGraph.nodes) {
        visualSettings.partitionColour[partition.id] = groupColours(partition.id);
    }
}

const updatePartitionColourList = function () {
    const partitionColourList = d3.select("#partition-colour-list").html("");
    d3.select('#list-selections')
        .selectAll("div")
        .style("background-color", function (d) {
            return addListColour(d.id, visualSettings.partitionColour[d.id], "partition", partitionColourList)
                .property("value");
        });
    
}

//***********************************Node size section********************************************
const setAttributeNodeSizing = function (selectElement) {
    const attributeName = selectElement.value;
    const defaultRadius = currentGraph.getForcePropertyValue(Graph.forceNames.collide, "radius");
    visualSettings.currentNodeSize = attributeName;

    if (attributeName !== "") {
        const optgroup = selectElement.options[selectElement.selectedIndex].closest('optgroup').getAttribute('label');
        let attributeMax = null;
        let attributeMin = null;
        let getValueFunction = null;

        if (optgroup === "Attributes") {
            //attributeMax = parseFloat($("#" + attributeName + "-sliderOutputMin").attr("max"));
            //attributeMin = parseFloat($("#" + attributeName + "-sliderOutputMin").attr("min"));
            attributeMax = currentGraph.max(attributeName);
            attributeMin = currentGraph.min(attributeName);
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

            const resultRadius = (defaultRadius * 2) * ((attributeValue - attributeMin) / (attributeMax - attributeMin)) + 1;
            return d.r = resultRadius;
        });

        setNodeFontSize();
        return;
    }

    
    node.attr("r", function (d) {
        return d.r = defaultRadius;
    });
    setNodeFontSize();
}

//********************************Colour settings utils***************************/

const rgbObjectToString = function (rgbObject) {
    const rgb = 'rgb(' + rgbObject.r + ', '
        + rgbObject.g + ', '
        + rgbObject.b + ')';
    return rgb;
}

const pickHex = function (color1, color2, weight) {
    const w2 = weight;
    const w1 = 1 - w2;
    const rgb = {
        r: Math.round(color1.r * w1 + color2.r * w2),
        g: Math.round(color1.g * w1 + color2.g * w2),
        b: Math.round(color1.b * w1 + color2.b * w2)
    };
    return rgb;
}

const addListColour = function (label, colour, idPrefix, colourList) {
    const labelWithoutWhitespaces = removeSpacesAndCommas(label);
    const id = `${idPrefix}-colour-${labelWithoutWhitespaces}`;
    const newDistinctColourRow = colourList.append("li")
    const newDistinctColourRowDiv = newDistinctColourRow.append("div")
        .classed("colour-row-list", true);
    newDistinctColourRowDiv.append("label")
        .attr("title", label)
        .attr("for", id)
        .html(label);
    const newColorRowInput = newDistinctColourRowDiv.append("input")
        .attr("type", "color")
        .attr("id", id)
        .property("value", colour);
    newDistinctColourRow.on("click", function () {
        newColorRowInput.node().click();
    })

    return newColorRowInput

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
        .property("value", function () { return randomColour(0); });
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

const hexToRgb = function (hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

const fontLightness = function (newColour) {
    const threshold = 0.5;
    let rgbRepresentation = newColour;
    if (typeof newColour !== 'object') {
        rgbRepresentation = hexToRgb(newColour);
    }
    const { r, g, b } = rgbRepresentation;

    const lumaRed = r * 0.2126;
    const lumaGreen = g * 0.7152;
    const lumaBlue = b * 0.0722;

    const lumaSum = lumaRed + lumaGreen + lumaBlue;
    const perceivedLightness = lumaSum / 255;

    const finalLightness = (perceivedLightness - threshold) * -10000000;

    return finalLightness;
}

const getGradientColour = function (colourObject, attributeValue, attributeMin, attributeMax) {
    

    const firstColour = colourObject[0];
    if (attributeValue <= firstColour.value) {
        return hexToRgb(firstColour.colour);
    }

    let lowValueColourRGB = null;
    let highValueColourRGB = null;
    for (let i = 1; i < colourObject.length; i++) {
        if (attributeValue <= colourObject[i].value) {
            lowValueColourRGB = hexToRgb(colourObject[i - 1].colour);
            highValueColourRGB = hexToRgb(colourObject[i].colour);
            const resultValue = ((parseFloat(attributeValue) - attributeMin) / (attributeMax - attributeMin));
            const resultColour = pickHex(lowValueColourRGB, highValueColourRGB, resultValue);
            return resultColour;
        }
    }

    const lastColour = colourObject[colourObject.length - 1];
    return hexToRgb(lastColour.colour);

}