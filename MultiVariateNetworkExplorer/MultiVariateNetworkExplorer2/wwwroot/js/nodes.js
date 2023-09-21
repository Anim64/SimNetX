////function toggleNodeDetails(nodeId, headingId, detailsId, nodeRowGroupId) {
////    let headingElement = document.getElementById(headingId);
////    let detailsElement = document.getElementById(detailsId);

////    if (detailsElement.style.display === 'none' || detailsElement.style.display === '') {
////        detailsElement.style.display = 'block';
////        let inputs = detailsElement.querySelectorAll('input');

////        inputs.forEach((input) => {
////            let attributeName = input.id.substring(input.id.indexOf('-') + 1, input.id.length);
////            input.value = graph.nodes[nodeId][attributeName];
////        });

////    }

////    else {
////        if (!headingElement.classList.contains('active-node-heading')) {
////            let rowHeadings = $('#' + nodeRowGroupId + ' .active-node-heading');

////            rowHeadings.removeClass('active-node-heading');

////            let inputs = detailsElement.querySelectorAll('input');

////            inputs.forEach((input) => {
////                let attributeName = input.id.substring(input.id.indexOf('-') + 1, input.id.length);
////                input.value = graph.nodes[nodeId][attributeName];
////            });

////        }
////        else {
////            detailsElement.style.display = 'none';
////        }
////    }

////    headingElement.classList.toggle('active-node-heading');
////}

const prepareNodeDatalist = function () {
    const nodeInput = document.getElementById("node-list-input");
    const nodeDataList = document.getElementById("node-list");

    nodeInput.addEventListener("focus", showNodeDataList)
    nodeInput.addEventListener("keyup", filterNodeSearchList);
    nodeInput.addEventListener("blur", function(){
        nodeDataList.classList.remove("active-block");
    });
    nodeInput.addEventListener("mousedown", function () {
        if (document.activeElement === nodeInput) {
            nodeInput.blur();
        }
    })

}

const showNodeDataList = function () {
    const nodeDataList = document.getElementById("node-list");
    nodeDataList.classList.add('active-block');
    
}

const filterNodeSearchList = function () {
    const nodeInput = document.getElementById("node-list-input");
    const filterValue = nodeInput.value.toLowerCase();
    const nodeList = document.getElementById("node-list");
    const nodeListItems = nodeList.getElementsByTagName("*");

    for (const nodeListItem of nodeListItems) {
        const nodeId = nodeListItem.textContent;
        if (nodeId.startsWith(filterValue)) {
            nodeListItem.style.display = "";
            continue;
        }
        nodeListItem.style.display = "none";
    }
}
const nodeHeadingClick = function (event, nodeId, nodeIndex) {
    selectNode(event,nodeId);
    toggleNodeDetails(nodeId, nodeIndex);
    showNodeNeighbors(nodeId);
}

const nodeHeadingMouseOver = function (nodeId, opacity) {
    fadeDisconnectedNodes(nodeId, opacity);
}

const selectNode = function (event, nodeId) {
    if (!event.shiftKey) {
        deselectAllNodes();
    }
    
    nodeGroups.classed('selected', function (d) {
        return d.selected = d.selected | d.id == nodeId;
    });
}

const toggleNodeDetails = function (nodeId, nodeIndex) {
    const nodeInput = document.getElementById("node-list-input");
    nodeInput.value = nodeId;
    const detailsElement = document.getElementById("node-detail-container");
    const attributesDiv = document.getElementById("node-attributes");
    const centralitiesDiv = document.getElementById("node-centralities");

    detailsElement.setAttribute('data-id', nodeId)

    if (detailsElement.style.display === 'none' || detailsElement.style.display === '') {
        detailsElement.style.display = 'block';
    }

    let inputs = attributesDiv.getElementsByTagName('input');

    for (const input of inputs) {
        //let attributeName = input.id.substring(input.id.indexOf('-') + 1, input.id.length);
        const attributeName = input.getAttribute('data-attribute');
        input.value = graph.nodes[nodeIndex][attributeName];
    };

    inputs = centralitiesDiv.getElementsByTagName('input');

    for (const input of inputs) {
        //let attributeName = input.id.substring(input.id.indexOf('-') + 1, input.id.length);
        const attributeName = input.getAttribute('data-attribute');
        const { [attributeName]: attributeValues } = graph.properties;
        input.value = attributeValues !== undefined ? attributeValues.values[nodeId] : "Calculating";
        
    };
}


const showNodeNeighbors = function (nodeId) {
    const neighborsContainer = document.getElementById("node-neighbors-section");

    const neighborsHeadlineElement = neighborsContainer.firstElementChild;
    neighborsHeadlineElement.innerHTML = "Node \"" + nodeId + "\" neighbors";

    createNeighborHeadings(nodeId);
    
}

const createNeighborHeadings = function (nodeId) {
    const neighborsGridElement = d3.select("#neighbors-nav");
    neighborsGridElement.html("");

    for (const link of graph.links) {
        let neighbor = null;
        if (link.source.id === nodeId) {
            neighbor = link.target;
        }
        if (link.target.id === nodeId) {
            neighbor = link.source;
        }

        if (neighbor != null) {
            const { id: neighborId, index: neighborIndex } = neighbor;
            createNeighborHeading(neighborsGridElement, neighborId, neighborIndex);
        }
        
    }
}

const createNeighborHeading = function (neighborsGridElement, neighborId, neighborIndex) {
    neighborsGridElement.append("div")
        .classed("node-heading", true)
        .attr("role", "tab")
        .attr("id", "neighbor-heading-" + neighborId)
        .on("mouseout", function () { /*mouseOut()*/ })
        .on("click", function () { nodeHeadingClick(event, neighborId, neighborIndex) })
        .on("mouseover", function () { /*nodeHeadingMouseOver(id, .2)*/ })
        .append("h5")
        .html(neighborId);
}


