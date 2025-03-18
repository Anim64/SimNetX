const attributeTransform = {}
const excludedAttributes = [];

const updateRemodelOptionsHeader = function (headerId, attributeSelectId) {
    const header = document.getElementById(headerId);
    const attributeSelect = document.getElementById(attributeSelectId);
    header.innerHTML = attributeSelect.value + " remodeling options";
}

const displayAttributeTransformation = function (attribute, transformationListId) {
    d3.select("#" + transformationListId).html("");
    const { [attribute]: transformations } = attributeTransform;
    if (transformations) {
        for (const transformation of transformations) {
            const transformationName = transformation.charAt(0).toUpperCase() + transformation.slice(1);
            addTransformationElement(transformationListId, transformation, transformationName);
        }
    }
    //const remodelCheckbox = document.getElementById("remodel-checkbox");
    //const isIn = excludedAttributes.includes(attribute);
    //remodelCheckbox.checked = !isIn;
} 

const deleteAllTransformations = function () {
    attributeTransform = {};
    document.getElementById("attribute-transformation-list").innerHTML = "";
}
const clearAttributeTransformations = function (attributeSelectId) {
    document.getElementById("attribute-transformation-list").innerHTML = "";
    const attribute = document.getElementById(attributeSelectId).value;
    if (attributeTransform[attribute]) {
        delete attributeTransform[attribute];
    }
}

const deleteTransformation = function (deleteBtn) {
    const transformationItem = deleteBtn.parentElement;
    const selectedAttribute = document.getElementById("remodel-network-select").value;
    const transformationItemIndex = $(transformationItem).index();
    attributeTransform[selectedAttribute].splice(transformationItemIndex, 1);
    transformationItem.remove();
}

const transformationDragStart = function (e) {
    var index = $(e.currentTarget).index();
    e.dataTransfer.setData('text/plain', index);
}

const transformationDrop = function (e) {
    cancelDefaultBehaviour(e);
    const selectedAttribute = document.getElementById("remodel-network-select").value;
    this.classList.remove("transformation-dragover");
    // get new and old index
    const oldIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const target = $(e.currentTarget);
    const newIndex = target.index();

    if (newIndex === oldIndex) {
        return;
    }

    const transformArray = attributeTransform[selectedAttribute];
    const temp = transformArray[newIndex];
    transformArray[newIndex] = transformArray[oldIndex];
    transformArray[oldIndex] = temp;

    // remove dropped items at old place
    let dropped = $(this).parent().children().eq(oldIndex).remove();

    // insert the dropped items at new place
    if (newIndex < oldIndex) {
        target.before(dropped);
    } else {
        target.after(dropped);
    }
}

const transformationDragOver = function (e) {
    cancelDefaultBehaviour(e);
    this.classList.add("transformation-dragover");
}

const transformationDragLeave = function (e) {
    cancelDefaultBehaviour(e);
    this.classList.remove("transformation-dragover");
}


const addToTransformationList = function (attribute, transformationType) {
    if (!(attribute in attributeTransform)) {
        attributeTransform[attribute] = [];
    }

    attributeTransform[attribute].push(transformationType);
}

const addTransformationElement = function (transformationListId, transformationType, transformationName) {
    const newTransformationListItem = d3.select("#" + transformationListId)
        .append("li")
        .classed("transformation-li", true)
        .attr("draggable", true)
        .attr("data-role", transformationType)

    newTransformationListItem.node().addEventListener("dragstart", transformationDragStart, true);
    newTransformationListItem.node().addEventListener("drop", transformationDrop, true);
    newTransformationListItem.node().addEventListener("dragover", transformationDragOver, true);
    newTransformationListItem.node().addEventListener("dragenter", cancelDefaultBehaviour, true);
    newTransformationListItem.node().addEventListener("dragleave", transformationDragLeave, true);


    newTransformationListItem
        .append("h5")
        .text(transformationName)

    newTransformationListItem
        .append("button")
        .text("Delete")
        .on("click", function () { deleteTransformation(this); })
}

const addTransformation = function (transformationBtn, attributeSelectId, transformationListId) {
    const transformationControlElement = transformationBtn.parentElement;
    const transformationName = transformationControlElement.firstElementChild.innerHTML;
    const transformationType = transformationControlElement.getAttribute("data-role");
    const attributeSelect = document.getElementById(attributeSelectId);
    const attribute = attributeSelect.value;

    if (attribute !== "" && attribute !== undefined) {
        addToTransformationList(attribute, transformationType);
        addTransformationElement(transformationListId, transformationType, transformationName);
    }
}

const addTransformationToAll = function (transformationBtn, attributeSelectId) {
    const transformationControlElement = transformationBtn.parentElement;
    const transformationName = transformationControlElement.firstElementChild.innerHTML;
    const transformationType = transformationControlElement.getAttribute("data-role");
    const attributeSelect = document.getElementById(attributeSelectId);
    const selectedAttribute = attributeSelect.value;

    if (selectedAttribute !== "" && selectedAttribute !== undefined) {
        for (let attribute of attributeSelect.options) {
            addToTransformationList(attribute.value, transformationType);
        }

        addTransformationElement("attribute-transformation-list", transformationType, transformationName);
    }
}

const transferSelectedOptions = function(fromSelectId, toSelectId){
    const fromSelectedOptions = $(`#${fromSelectId} option:selected`).remove();
    const toSelect = $(`#${toSelectId}`);

    toSelect.append(fromSelectedOptions);
}

const remodelNetwork = function (checkboxesDivId, algorithmSelectId, metricSelectId, nulifyId) {
    const selectedAlgorithm = document.getElementById(algorithmSelectId).value;
    const selectedMetric = document.getElementById(metricSelectId).value;
    const nulify = document.getElementById(nulifyId).checked;
    const excludedAttributes = $("#remodel-inactive-attributes-select option")
        .map(function ()
        {
            return $(this).val();
        }).get();


    const networkRemodelParams =
    {
        "metric": {
            "name": selectedMetric,
            "params": [],
            "nulify": nulify


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

    const selectedParametersDiv = selectedAlgorithm.toLowerCase() + "-parameters-remodel";
    const algorithmParametersDiv = document.getElementById(selectedParametersDiv);
    const parameterInputs = algorithmParametersDiv.querySelectorAll("input[type=number]");
    const algorithmParams = networkRemodelParams["algorithm"]["params"];
    for (const parameter of parameterInputs) {
        algorithmParams.push(parseFloat(parameter.value));
    }
    

    const nodes_string = JSON.stringify(dataStore.nodeData);
    const attributes_string = JSON.stringify(currentGraph.attributes);
    const attribute_transform_string = JSON.stringify(attributeTransform);
    const network_remodel_params_string = JSON.stringify(networkRemodelParams);
    const excluded_attributes_string = JSON.stringify(excludedAttributes);

    $.ajax({
        url: 'RemodelNetwork',
        type: 'POST',
        
        data: {
            nodes: nodes_string,
            attributes: attributes_string,
            attributeTransform: attribute_transform_string,
            networkRemodelParams: network_remodel_params_string,
            excludedAttributes: excluded_attributes_string
        },
        success: function (result) {
            if (result.newVectorData != "") {
                const newVectorData = JSON.parse(result.newVectorData);
                //currentGraph.nodes = newVectorData;
                dataStore.nodes = newVectorData;
                //updateNodes();
            }
            const newNet = JSON.parse(result.newNetwork);
            currentGraph.links = newNet;
            currentGraph.metric = networkRemodelParams.metric;
            currentGraph.conversionAlg = networkRemodelParams.algorithm;

            currentGraph.updateLinkIndeces();

            updateNodesAndLinks();
            requestCommunityDetection(currentGraph);
            calculateAllMetrics();
            startSimulation();

        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(thrownError);
        }
    });
}