const generateGraphControlsAndElements = function () {
    generateLayoutControls();
}


const generateGraphElements = function (graph) {
    generateNodeHeadings(graph);
    generateNodeDetails(graph);
}


const generateNodeDetails = function (graph) {
    const nodeAttributesDiv = d3.select("#node-attributes");
    const { numAttributes, catAttributes } = graph.attributes;
    for (const attribute of numAttributes) {
        generateNodeDetailDisplayElements(nodeAttributesDiv, attribute);
        const containerDivId = `${attribute}-histogram-container`;
        nodeAttributesDiv.append("div")
            .attr("id", containerDivId);

        const attributeValues = graph.getAllAttributeValues(attribute)
        hist(containerDivId, attributeValues, attribute, 300, 250);
    }

    for (const attribute of catAttributes) {
        generateNodeDetailDisplayElements(nodeAttributesDiv, attribute);
    }
}

const generateNodeDetailDisplayElements = function (nodeAttributesDiv, attribute) {
    const attributeDiv = nodeAttributesDiv.append("div")
        .classed("node-property-group", true);

    attributeDiv.append("label")
        .attr("title", attribute)
        .attr("for", "display-" + attribute)
        .html(attribute + ":");

    attributeDiv.append("input")
        .attr("type", "text")
        .attr("id", "display-" + attribute)
        .attr("value", "")
        .attr("data-attribute", attribute)
        .property("readonly", true);
}

const generateNodeHeadings = function (graph) {
    const nodeHeadingsList = d3.select("#node-list");
    for (const node of graph.nodes) {
        const { id, index } = node;
        const nodeHeading = nodeHeadingsList.append("li")
            .classed("node-li", true)
            .attr("id", "node-li-" + node.id)
            .on("mousedown", function () { nodeHeadingClick(id, index) })
            .html(id);
    }
    

    
}

const generateLayoutControls = function () {
    const { x, y } = currentGraph.forces.center;
    updateForceControlValue("center_XSliderOutput", x);
    updateForceControlValue("center_YSliderOutput", y);

    const { strength: chargeStrength, enabled: chargeEnabled, distanceMin, distanceMax } = currentGraph.forces.charge;
    updateForceState("charge_EnabledCheckbox", chargeEnabled);
    updateForceControlValue("charge_StrengthSliderOutput", chargeStrength);
    updateForceControlValue("charge_distanceMinSliderOutput", distanceMin);
    updateForceControlValue("charge_distanceMaxSliderOutput", distanceMax);

    const { strength: collideStrength, enabled: collideEnabled, radius, iterations: collideIterations } = currentGraph.forces.collide;
    updateForceState("collide_EnabledCheckbox",collideEnabled);
    updateForceControlValue("collide_StrengthSliderOutput", collideStrength);
    updateForceControlValue("collide_radiusSliderOutput", radius);
    updateForceControlValue("collide_iterationsSliderOutput", collideIterations);

    const { enabled: linksEnabled, distance, iterations: linkIterations } = currentGraph.forces.link;
    updateForceState("link_EnabledCheckbox", linksEnabled);
    updateForceControlValue("link_DistanceSliderOutput", distance);
    updateForceControlValue("link_IterationsSliderOutput", linkIterations);

    const { attributes } = graph;
    const { numAttributes } = attributes;
    const { attribute: xAttribute } = currentGraph.forces.forceX;
    updateAttributeList("project-x-attributes", numAttributes, xAttribute);

    const { attribute: yAttribute } = currentGraph.forces.forceY;
    updateAttributeList("project-y-attributes", numAttributes, yAttribute);
}

const generateVisualControls = function () {
    document.getElementById("network-colour-input").value = visualSettings.monoColour;
    const { num: features, cat: labels } = currentGraph.attributes;
    const allAttributes = [...features, ...labels];

    updateAttributeList("node-label-select", allAttributes, visualSettings.currentLabel);

    updateAttributeList("attribute-node-colouring", features, visualSettings.gradientColour.currentFeature);


    updateGradientColourList(attribute - node - colouring);
    updateGradientLegendAxis("attribute-node-colouring");
    updateGradientLegend('attribute-node-colouring-preview', 'numerical-colour-list');

}

const updateForceControlValue = function (forceControlId, forcePropertiesValue) {
    const forceOutput = document.getElementById(forceControlId);
    const forceSlider = forceOutput.nextElementSibling;

    forceOutput.innerHTML = forceSlider.value = forcePropertiesValue;
}

const updateForceState = function (forceCheckboxId, state) {
    const forceCheckbox = document.getElementById(forceCheckboxId);
    forceCheckbox.checked = state;
}

const updateAttributeList = function (forceSelectId, attributes, chosenAttribute) {
    const forceSelect = d3.select("#" + forceSelectId);
    const attributeOptGroup = forceSelect.select('optgroup[label=Attributes]');
    for (const attribute of attributes) {
        attributeOptGroup.append("option")
            .property("value", attribute)
            .html(attribute);
    }

    forceSelect.property("value", chosenAttribute);

    return forceSelect.node();
}

const updateColouringForceAttributeList = function (forceSelectId, attributes, chosenAttribute) {
    const forceSelect = d3.select("#" + forceSelectId);
    const { numAttributes, catAttributes } = attributes;
    const numericAttributeOptGroup = forceSelect.select('optgroup[label="Numeric Attributes"]');
    for (const attribute of numAttributes) {
        numericAttributeOptGroup.append("option")
            .property("value", attribute)
            .html(attribute);
    }

    //const categoricalAttributeOptGroup = forceSelect.select('optgroup[label="Categorical Attributes"]');
    //for (const attribute of catAttributes) {
    //    categoricalAttributeOptGroup.append("option")
    //        .property("value", attribute)
    //        .html(attribute);
    //}

    forceSelect.property("value", chosenAttribute);

    return forceSelect.node();
}

const updateColouringColourInputs = function (lowColour, highColour) {
    document.getElementById("low-value-colour").value = lowColour;
    document.getElementById("high-value-colour").value = highColour;
}

const updateColourControl = function (forceColourId, colourValue) {
    document.getElementById(forceColourId).value = colourValue;
}

const generateAttributeFilters = function (filters) {
    const filtersDiv = d3.select("#attributes");

    for (const numericAttribute of filters.numeric) {
        const { attribute, min, max, lowValue, highValue } = numericAttribute;
        const numericDiv = filtersDiv.append("div")
            .classed("numeric", true);

        numericDiv.append("h4")
            .html(attribute);

        numericDiv.append("div")
            .attr("id", attribute + "-slider");

        const sliderOutputsDiv = numericDiv.append("div")
            .classed("row", true);

        createDoubleSlider(attribute + "-slider", attribute + "-sliderOutputMin", attribute + "-sliderOutputMax", min, max, lowValue, highValue);


        sliderOutputsDiv.append("div")
            .classed("col-md-4", true)
            .append("input")
            .attr("type", "number")
            .attr("id", attribute + "-sliderOutputMin")
            .property("min", min)
            .property("max", max)
            .property("value", lowValue)
            .attr("step", "0.01")
            .on("change", function () {
                $("#" + attribute + "-slider").slider('option', 'value', this.value);
                filterByValue(this, attribute, FilterCondition.lower, false);
            });

        sliderOutputsDiv.append("div")
            .classed("col-md-4 offset-md-4", true)
            .append("input")
            .attr("type", "number")
            .attr("id", attribute + "-sliderOutputMax")
            .property("min", min)
            .property("max", max)
            .property("value", highValue)
            .attr("step", "0.01")
            .on("change", function () {
                $("#" + attribute + "-slider").slider('option', 'value', this.value);
                filterByValue(this, attribute, FilterCondition.greater, true);
            });

    }

    

    for (const categoricalAttribute of filters.categorical) {
        const { attribute, categories } = categoricalAttribute;
        const categoricalDiv = filtersDiv.append("div")
            .classed("categorical", true);

        categoricalDiv.append("h4")
            .html(attribute);

        const categoriesDiv = categoricalDiv.append("div")
            .classed("checkboxes", true);

        for (const [category, checked] of Object.entries(categories)) {
            categoriesDiv.append("label")
                .attr("for", category + "-checkbox")
                .html(category);

            categoriesDiv.append("input")
                .attr("type", "checkbox")
                .attr("id", category + "-checkbox")
                .property("value", category)
                .on("change", function () { filterByCategory(attribute, category, this.checked); })
                .property("checked", checked);

        }
            

    }

}

const generateRemodelAttributes = function (graph) {
    const remodelAttributesSelect = d3.select("#remodel-network-select");
    const { numAttributes} = graph.attributes;
    for (const attribute of numAttributes) {
        remodelAttributesSelect
            .append("option")
            .html(attribute);
    }
}

const clearGraphElementsAndControls = function () {
    //Layout elements
    clearLayoutElements();
    //Visual elements
    clearVisualElements();
    //Remodel elements
    clearRemodelElements();
    //Network canvas
    clearNetworkCanvas();
    //Cluster statistics
    clearClusterStatistics();
    //Nodes, histograms
    clearNodeSection();
    //Cluster detection attribute
    clearClusterAttributeSelect();

    //Clusters
    deleteAllSelections();
    

}

const clearLayoutElements = function () {
    deleteForceAttributeList("project-x-attributes");
    deleteForceAttributeList("project-y-attributes");
}

const clearVisualElements = function () {
    deleteForceAttributeList("node-label-select");
    deleteForceAttributeList("attribute-node-colouring");
    clearElement("categorical-attribute-node-colouring");
    deleteForceAttributeList("attribute-node-sizing");
}

const clearRemodelElements = function () {
    clearElement("remodel-active-attributes-select");
    clearElement("remodel-inactive-attributes-select");
}

const clearNetworkCanvas = function () {
    d3.select("#networkGraph svg").html("");
    d3.select("#networkHeatmap svg").html("");
}

const clearClusterStatistics = function () {
    clearElement("partition-metric-mcc-attribute-select");
    clearElement("partition-metric-mcc-graph-container");
    clearElement("partition-metric-partition-boxplot-graph-container");
    clearElement("partition-metric-attribute-boxplot-graph-container");
}

const clearNodeSection = function () {
    //Node search list
    clearElement("node-list");
    //Node features
    clearElement("node-attributes-numerical");
    //Node labels
    clearElement("node-attributes-categorical");
    //Node neighbours
    clearElement("node-grid");
}

const clearClusterAttributeSelect = function () {
    const clusterDetectionAttributeSelect = document.getElementById("partitions-selection-attributes");
    clusterDetectionAttributeSelect.length = 1;
    clusterDetectionAttributeSelect.selectedIndex = 0;
}

const deleteForceAttributeList = function (forceSelectId) {
    d3.select("#" + forceSelectId).selectAll('optgroup[label]:not([label="Centralities"])').html("");
}


