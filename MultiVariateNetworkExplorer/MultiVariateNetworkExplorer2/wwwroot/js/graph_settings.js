
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
        const { source, target, value } = l;
        if (!(filterNodeList.includes(source) || filterNodeList.includes(target)) && l.filtered) {
            const returningLink = {
                "id": id,
                "source": source,
                "target": target,
                "value": value
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
    currentGraph.stopSimulation();
    d3.select("#reset-layout-btn")
        .style("color", "red")
        .style("border-color", "red");
    //startSimulation();
}

const handleForceChange = function (value, sliderOutputId, force, property, forceUpdateDelegate) {
    d3.select('#' + sliderOutputId).text(value);
    currentGraph.setForcePropertyValue(force, property, Number(value))
    forceUpdateDelegate();
    currentGraph.stopSimulation();
    d3.select("#reset-layout-btn")
        .style("color", "red")
        .style("border-color", "red");
}

const getNodeAttribute = function (d, attributeName) {
    return currentGraph.getNodeDataValue(d.id, attributeName);
};
const getNodeProperty = function (d, attributeName) {
    return currentGraph.getPropertyValue(d.id, attributeName);;
};

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


