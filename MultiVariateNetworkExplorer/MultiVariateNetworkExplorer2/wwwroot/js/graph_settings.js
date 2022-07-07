
const isLower = function(value1, value2) {
    return value1 < value2;
}

const isGreater = function(value1, value2) {
    return value1 > value2;
}


class FilterCondition {
    static lower = new FilterCondition(isLower);
    static greater = new FilterCondition(isGreater);

    constructor(booleanFunction) {
        this.booleanFunction = booleanFunction;
    }
}


const filterByValue = function (input, filteredAttributeName, filterCondition, minmax) {
    //var value = event.currentTarget.value;

    const value = input.value;
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
                    filterNodeList.splice(filterNodeList.indexOf(n.id), 1)
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
                    filterNodeList.splice(filterNodeList.indexOf(n.id), 1)
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
    const optgroup = selectElement.options[selectElement.selectedIndex].closest('optgroup')

    if (optgroup !== null) {
        const optGroupLabel = optgroup.getAttribute('label');
        if (optGroupLabel === "Attributes") {
            getValueFunction = getNodeAttribute;
        }

        else if (optGroupLabel === "Centralities") {
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
    const w1 = weight;
    const w2 = 1 - w1; 
    const rgb = {
        r: Math.round(color1.r * w1 + color2.r * w2),
        g: Math.round(color1.g * w1 + color2.g * w2),
        b: Math.round(color1.b * w1 + color2.b * w2)
    };
    //var rgb = 'rgb(' + Math.round(color1.b * w1 + color2.b * w2)  + ', '
    //+ Math.round(color1.g * w1 + color2.g * w2) + ', '
    //    + Math.round(color1.r * w1 + color2.r * w2) + ')';
    return rgb;
}

const setAttributeNodeColouring = function (selectElement) {
    const lowValueColour = hexToRgb(document.getElementById('low-value-colour').value);
    const highValueColour = hexToRgb(document.getElementById('high-value-colour').value);

    const attributeName = selectElement.value;

    if (attributeName !== "") {
        forceProperties.colouring.enabled = true;
        const optgroup = selectElement.options[selectElement.selectedIndex].closest('optgroup').getAttribute('label');
        let attributeMax = null;
        let attributeMin = null;
        let getValueFunction = null;

        if (optgroup === "Numerical Attributes") {
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
                return defaultColour;
            }
            
            const resultValue = ((parseFloat(attributeValue) - attributeMin) / (attributeMax - attributeMin));
            const resultColour = pickHex(lowValueColour, highValueColour, resultValue);
            const lightness = fontLightness(resultColour);
            const node_text = $('#' + d.id + '_node_text');
            node_text.css("fill", 'hsl(0, 0%, ' + String(lightness) + '%)')
            return rgbObjectToString(resultColour);
        });
        link.style("stroke", 'white');
        return;
    }

    forceProperties.colouring.enabled = false;
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

    simulation.force(forceName)
        .x(width * x);

    updateForces();
}


function projectAttributeYAxis(selectElement) {
    const attributeName = selectElement.value;
    const { strength, enabled, y } = forceProperties.forceY;
    const forceName = "forceY";

    const getNodeAttribute = function (d, attributeName) { return d[attributeName]; };
    const getNodeProperty = function (d, attributeName) { return graph.properties[attributeName].values[d.id] };

    simulation.force(forceName)
        .strength(strength * enabled);

    if (attributeName !== "") {

        forceProperties.forceY.enabled = true;
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

    simulation.force(forceName)
        .y(height * y);

    updateForces();
    
}

const createDoubleSlider = function(sliderId, minValueId, maxValueId, minValue, maxValue) {
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
                filterByValue(ui, minValueId.split("-")[0], FilterCondition.lower, false)
            }
            else if (ui.handleIndex === 1) {
                filterByValue(ui, maxValueId.split("-")[0], FilterCondition.greater, true)
            }
        }
    });
    //$("#" + minValueId).val($("#" + sliderId).slider("values", 0));
    //$("#" + maxValueId).val($("#" + sliderId).slider("values", 1));

}

const hideConversionParameters = function () {
    $(".remodel-parameters-div").css("display", "none");
}

function displayConversionParameters(conversion_alg) {

    hideConversionParameters();
    const remodelParametersHeadline = document.getElementById("remodel-parameters-headline");

    if (conversion_alg === "Epsilon") {
        const epsilonParametersDiv = document.getElementById("epsilon-parameters");
        epsilonParametersDiv.style.display = "grid";
        remodelParametersHeadline.style.display = "block";
    }

    else {
        remodelParametersHeadline.style.display = "none";
    }

    remodelParametersHeadline.parentElement.style.height = "auto";
}

const remodelNetwork = function (checkboxesDivId, algorithmSelectId, metricSelectId) {
    const attributeCheckboxDiv = document.getElementById(checkboxesDivId);
    const selectedAlgorithm = document.getElementById(algorithmSelectId).value;
    const selectedMetric = document.getElementById(metricSelectId).value;


    const checkboxes = $(attributeCheckboxDiv).find("input[type='checkbox']:checked");
    const selected_attributes = checkboxes.map((index, checkbox) => {
        return checkbox.value;
    });
    
    let metricFunction = null;
    switch (selectedMetric) {
        case 'Gaussian':
            metricFunction = gaussianKernel;
            break;
        case 'Cosine':
            metricFunction = cosineKernel;
            break;
        case 'Euclidean':
            metricFunction = euclideanKernel;
        default:
            metricFunction = gaussianKernel;
            break;
    }
    let newNet = null;

    switch (selectedAlgorithm) {
        default:
        case 'LRNet':
            newNet = LRNet(graph.nodes, selected_attributes, metricFunction);
            break;
        

        case 'Epsilon':
            const epsilonRadius = parseFloat(document.getElementById('epsilonRadius').value);
            const k = parseInt(document.getElementById('kNNmin').value);
            newNet = EpsilonAndkNN(graph.nodes, selected_attributes, metricFunction, epsilonRadius, k);
            break;
    }

    graph.links = newNet;
    store.links = newNet.map(a => { return { ...a } })
    updateLinks();
    updateLinkColour(link);
    resetSimulation();
   
}

const gaussianKernel = function(nodes, attributes, sigma = 1) {
    const gaussianKernelMat = new Array(nodes.length * nodes.length);
    const nodeCount = nodes.length;

    for (const [index, node] of nodes.entries()) {
        for (let i = index; i < nodeCount; i++) {

            if (i === index) {
                gaussianKernelMat[index * nodeCount + i] = gaussianKernelMat[i * nodeCount + index] = 1
            }
            else {
                const distance = euclideanDistance(node, nodes[i], attributes);
                const similarity = (1.0 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp((-distance) / (2 * Math.pow(sigma, 2)));
                gaussianKernelMat[index * nodeCount + i] = gaussianKernelMat[i * nodeCount + index] = similarity;
            }

        }
    }

    return gaussianKernelMat;
}

const cosineKernel = function (nodes, attributes) {
    const cosineKernelMat = new Array(nodes.length * nodes.length);
    const nodeCount = nodes.length;

    for (const [index, node] of nodes.entries()) {
        const vectorMagnitudeA = calcVectorMagnitude(node, attributes);
        for (let i = index; i < nodeCount; i++) {

            if (i === index) {
                cosineKernelMat[index * nodeCount + i] = cosineKernelMat[i * nodeCount + index] = 1
                continue;
            }
            
            const vectorMagnitudeB = calcVectorMagnitude(nodes[i], attributes);
            const dotProduct = calcDotProduct(node, nodes[i], attributes);
            const similarity = dotProduct / (vectorMagnitudeA * vectorMagnitudeB);
            cosineKernelMat[index * nodeCount + i] = cosineKernelMat[i * nodeCount + index] = similarity;
        }
    }

    return cosineKernelMat;
}

const calcDotProduct = function (node1, node2, attributes) {
    let result = 0;
    for (const attribute of attributes) {
        const { [attribute]: node1Value } = node1;
        const { [attribute]: node2Value } = node2;
        if (typeof node1Value == 'number' && typeof node2Value == 'number') {
            result += node1Value * node2Value;
        }
    }

    return result;
}

const calcVectorMagnitude = function(node, attributes){
    let result = 0;
    for (const attribute of attributes) {
        const { [attribute]: nodeValue } = node;
        if (typeof nodeValue == 'number') {
            result += Math.pow(nodeValue, 2);
        }
    }

    result = Math.sqrt(result);
    return result;
}

const euclideanKernel = function (nodes, attributes) {
    const euclideanKernelMat = new Array(nodes.length * nodes.length);
    const nodeCount = nodes.length;

    for (const [index, node] of nodes.entries()) {
        for (let i = index; i < nodeCount; i++) {

            if (i === index) {
                euclideanKernelMat[index * nodeCount + i] = euclideanKernelMat[i * nodeCount + index] = 1;
                continue;
            }

            const euclideanDis = Math.sqrt(euclideanDistance(node, nodes[i], attributes));
            const similarity = 1 / euclideanDis;
            euclideanKernelMat[index * nodeCount + i] = euclideanKernelMat[i * nodeCount + index] = similarity;
        }
    }

    return euclideanKernelMat;
}

const euclideanDistance = function(node1, node2, attributes) {
    let result = 0;
    for (const attribute of attributes) {
        const { [attribute]: node1Value } = node1;
        const { [attribute]: node2Value } = node2;
        if (typeof node1Value == 'number' && typeof node2Value == 'number') {
            result += Math.pow(node1Value - node2Value, 2);
        }
    }

    return result;
}



const EpsilonAndkNN = function(nodes, attributes, kernelMatrixFunction, similarityThreshold = 0.5, k = 1) {
    const resultNet = new Array();
    const kernel = kernelMatrixFunction(nodes, attributes);
    const potentialNeighbours = Array.from(Array(nodes.length).keys());
    const nodeCount = nodes.length;
    const duplicateCheckDict = {};
    let edgeId = -1;
    for (const [index, node] of nodes.entries()) {
    
        potentialNeighbours.sort((node1, node2) => {
            const node1KernelIndex = index * nodeCount + node1;
            const node2KernelIndex = index * nodeCount + node2;

            if (kernel[node1KernelIndex] < kernel[node2KernelIndex]) {
                return 1;
            }

            else if (kernel[node1KernelIndex] > kernel[node2KernelIndex]) {
                return -1;
            }

            return 0;
        });

        let edgeCount = 0;
        let n = 0;

        while ((edgeCount < k || kernel[index * nodeCount + potentialNeighbours[n]] > similarityThreshold) && n < nodeCount) {
            const index1 = String(node.index);
            const index2 = String(nodes[potentialNeighbours[n]].index);
            const concatIndeces = index1 + index2;
            const concatIndecesReverse = index2 + index1;
            if (index !== potentialNeighbours[n] && (duplicateCheckDict[concatIndeces] == undefined || duplicateCheckDict[concatIndecesReverse] == undefined)) {
                duplicateCheckDict[concatIndeces] = duplicateCheckDict[concatIndecesReverse] = 1;
                const newLink = {
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
    }

    return resultNet;
}

const LRNet = function(nodes, attributes, kernelMatrixFunction) {
    const resultNet = new Array();
    const kernel = kernelMatrixFunction(nodes, attributes);
    const degrees = {};
    const significances = {};
    const representativeness = {};
    const nodeCount = nodes.length;
    let edgeId = -1;

    for (let index1 = 0; index1 < nodeCount; index1++) {
    
        let nearestNeighbour = -1;
        let maxSimilarity = -1;
        //degrees[index1] = 0;
        //significances[index1] = 0;
        degrees[index1] = 0;
        significances[index1] = 0;

        for (let index2 = 0; index2 < nodeCount; index2++) {
            if (index1 === index2) {
                continue;
            }

            //if (!degrees.hasOwnProperty(index1)) {
            //    degrees[index1] = 0;
            //    significances[index1] = 0;
            //}
            const kernelValue = kernel[index1 * nodeCount + index2];

            if (kernelValue > 0) {
                degrees[index1]++;
            }

            if (kernelValue > maxSimilarity) {
                maxSimilarity = kernelValue;
                nearestNeighbour = index2;
            }
        }

        significances[nearestNeighbour] = !significances.hasOwnProperty(nearestNeighbour)
            ? 0
            : significances[nearestNeighbour] + 1;

        
    }
    const duplicateCheckDict = {};

    for (const [index, node] of nodes.entries()) {
        representativeness[index] = significances[index] > 0
            ? 1.0 / (Math.pow((1 + degrees[index]), (1.0 / significances[index])))
            : 0;
        
        const k = parseInt(Math.round(representativeness[index] * degrees[index]), 10);

        const potentialNeighbours = Array.from(Array(nodeCount).keys());
        potentialNeighbours.sort(function (node1, node2) {
            const node1KernelIndex = index * nodeCount + node1;
            const node2KernelIndex = index * nodeCount + node2;

            if (kernel[node1KernelIndex] < kernel[node2KernelIndex]) {
                return 1;
            }

            else if (kernel[node1KernelIndex] > kernel[node2KernelIndex]) {
                return -1;
            }

            return 0;
        });

        let l = k > 0 ? k + 1 : 2;

        for (let n = 0; n < l; n++) {
            const index1 = String(node.index);
            const index2 = String(nodes[potentialNeighbours[n]].index);
            const concatIndeces = index1 + index2;
            const concatIndecesReverse = index2 + index1;

            if (index !== potentialNeighbours[n] && (duplicateCheckDict[concatIndeces] == undefined || duplicateCheckDict[concatIndecesReverse] == undefined)) {
                duplicateCheckDict[concatIndeces] = duplicateCheckDict[concatIndecesReverse] = 1;
                const newLink = {
                    source: node.id,
                    target: nodes[potentialNeighbours[n]].id,
                    value: 1,
                    id: ++edgeId
                };
                resultNet.push(newLink);
            }
        }
    }

    return resultNet;
}

const changeNetworkNodeColour = function(colour) {
    defaultColour = colour;
    updateNodeAndLinkColour(node, link);
}

const changeNetworkBackgroundColour = function (colour) {
    $('#network-background-rect.background').css("fill", colour);
}
