const generateGraphControlAndElements = function (graph, forceProperties, filters) {
    generateGraphElements(graph);
    generateGraphControls(graph, forceProperties, filters);
}


const generateGraphElements = function (graph) {
    generateNodeDetails(graph);
    generateNodeHeadings(graph);
}


const generateNodeDetails = function (graph) {
    const nodeAttributesDiv = d3.select("#node-attributes")
    for (const attribute in graph.attributes) {
        const attributeDiv = nodeAttributesDiv.append("div")
            .classed("node-property-group", true);

        attributeDiv.append("label")
            .attr("title", attribute)
            .attr("for", "display - " + attribute)
            .html(attribute + ":");

        attributeDiv.append("input")
            .attr("type", "text")
            .attr("id", "display-" + attribute)
            .attr("value", "")
            .attr("data-attribute", attribute)
            .property("readonly", true);
    }
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

const generateGraphControls = function (graph, forceProperties, filters) {
    const { x, y } = forceProperties.center;
    updateForceControlValue("center_XSliderOutput", x);
    updateForceControlValue("center_YSliderOutput", y);

    const { strength: chargeStrength, enabled: chargeEnabled, distanceMin, distanceMax } = forceProperties.charge;
    updateForceState("charge_EnabledCheckbox", chargeEnabled);
    updateForceControlValue("charge_StrengthSliderOutput", chargeStrength);
    updateForceControlValue("charge_distanceMinSliderOutput", distanceMin);
    updateForceControlValue("charge_distanceMaxSliderOutput", distanceMax);

    const { strength: collideStrength, enabled: collideEnabled, radius, iterations: collideIterations } = forceProperties.collide;
    updateForceState("collide_EnabledCheckbox",collideEnabled);
    updateForceControlValue("collide_StrengthSliderOutput", collideStrength);
    updateForceControlValue("collide_radiusSliderOutput", radius);
    updateForceControlValue("collide_iterationsSliderOutput", collideIterations);

    const { enabled: linksEnabled, distance, iterations: linkIterations } = forceProperties.link;
    updateForceState("link_EnabledCheckbox", linksEnabled);
    updateForceControlValue("link_DistanceSliderOutput", distance);
    updateForceControlValue("link_IterationsSliderOutput", linkIterations);

    const { attributes } = graph;

    const { attribute: xAttribute } = forceProperties.forceX;
    updateForceAttributeList("project-x-attributes", attributes, xAttribute);

    const { attribute: yAttribute } = forceProperties.forceY;
    updateForceAttributeList("project-y-attributes", attributes, yAttribute);

    const { enabled: labelEnabled, attribute: labelAttribute } = forceProperties.labels;
    //updateForceState("label_EnabledCheckbox", labelEnabled);
    const labelForceSelect = updateForceAttributeList("node-label-select", attributes, labelAttribute);
    setNodeLabel(labelForceSelect);

    const { attribute: sizingAttribute } = forceProperties.sizing;
    const sizingForceSelect = updateForceAttributeList("attribute-node-sizing", attributes, sizingAttribute);
    setAttributeNodeSizing(sizingForceSelect);

    const { network, background } = forceProperties.colouring;
    updateColourControl("network-colour-input", network);
    updateColourControl("background-colour-input", background);
    changeNetworkBackgroundColour(background);


    const { attribute: colouringAttribute, lowValue, highValue } = forceProperties.attributeColouring;
    const colouringForceSelect = updateColouringForceAttributeList("attribute-node-colouring", attributes, colouringAttribute);
    updateColouringColourInputs(lowValue, highValue);
    setAttributeNodeColouring(colouringForceSelect);

    generateAttributeFilters(filters);
    generateRemodelAttributes(graph);

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

const updateForceAttributeList = function (forceSelectId, attributes, chosenAttribute) {
    const forceSelect = d3.select("#" + forceSelectId);
    const attributeOptGroup = forceSelect.select('optgroup[label=Attributes]');
    for (const attribute in attributes) {
        attributeOptGroup.append("option")
            .property("value", attribute)
            .html(attribute);
    }

    forceSelect.property("value", chosenAttribute);

    return forceSelect.node();
}

const updateColouringForceAttributeList = function (forceSelectId, attributes, chosenAttribute) {
    const forceSelect = d3.select("#" + forceSelectId);
    const numericAttributeOptGroup = forceSelect.select('optgroup[label="Numeric Attributes"]');
    const categoricalAttributeOptGroup = forceSelect.select('optgroup[label="Categorical Attributes"]');
    for (const [attribute, type] of Object.entries(attributes)) {
        if (type === 0) {
            numericAttributeOptGroup.append("option")
                .property("value", attribute)
                .html(attribute);
            continue;
        }
        //categoricalAttributeOptGroup.append("option")
        //    .property("value", attribute)
        //    .html(attribute);
    }

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
            .classed("col-md-4 col-md-offset-4", true)
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

    for (const attribute in graph.attributes) {
        remodelAttributesSelect
            .append("option")
            .html(attribute);
    }
}

const deleteGraphElementsAndControls = function () {
    deleteAllSelections();
    deleteNodeDetailsAttributes();
    deleteNodeHeadings();
    deleteForceAttributeList("project-x-attributes");
    deleteForceAttributeList("project-y-attributes");
    deleteForceAttributeList("node-label-select");
    deleteForceAttributeList("attribute-node-sizing");
    deleteForceAttributeList("attribute-node-colouring");

    deleteAttributeFilters();
    deleteRemodelAttributes();
}

const deleteNodeDetailsAttributes = function () {
    const nodeAttributesDiv = document.getElementById("node-attributes");
    nodeAttributesDiv.innerHTML = "";
}

const deleteNodeHeadings = function () {
    const nodeHeadingsList = document.getElementById("node-list");
    nodeHeadingsList.innerHTML = "";
}

const deleteForceAttributeList = function (forceSelectId) {
    d3.select("#" + forceSelectId).select("optgroup[label=Attributes]").html("");
}

const deleteAttributeFilters = function () {
    const filtersDiv = document.getElementById("attributes");
    filtersDiv.innerHTML = "";
}

const deleteRemodelAttributes = function () {
    for (const attribute in attributeTransform) {
        delete attributeTransform[attribute];
    }
    excludedAttributes.length = 0;
    const remodelAttributesSelect = document.getElementById("remodel-network-select");
    remodelAttributesSelect.innerHTML = "";

    const attributeTransformationList = document.getElementById("attribute-transformation-list");
    attributeTransformationList.innerHTML = "";
}
