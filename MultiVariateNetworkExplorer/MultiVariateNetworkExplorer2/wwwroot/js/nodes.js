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
const nodeHeadingClick = function (nodeId, nodeIndex) {
    selectNode(nodeId);
    toggleNodeDetails(nodeId, nodeIndex);
    
    showNodeNeighbors(nodeId);
}

const nodeHeadingMouseOver = function (nodeId, opacity) {
    fadeDisconnectedNodes(nodeId, opacity);
}

const selectNode = function (nodeId) {
    deselectAllNodes();
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
        const attributeValue = currentGraph.getNodeDataValue(nodeId, attributeName);
        input.value = attributeValue;
        input.setAttribute("title", attributeValue);
    };

    showNodeValueInHistogram(nodeId, nodeIndex, attributesDiv);

    inputs = centralitiesDiv.getElementsByTagName('input');

    for (const input of inputs) {
        //let attributeName = input.id.substring(input.id.indexOf('-') + 1, input.id.length);
        const attributeName = input.getAttribute('data-attribute');
        const attributeValue = currentGraph.getPropertyValue(nodeId, attributeName)
        input.value = attributeValue !== undefined ? attributeValue : "Calculating";
        
    };

    
}

const showNodeValueInHistogram = function (nodeId, nodeIndex, attributeDiv) {
    const histogramSvgs = attributeDiv.getElementsByTagName("svg");
    for (const histogram of histogramSvgs) {
        //const d3Histogram = d3.select(histogram);
        const attributeName = histogram.getAttribute('data-attribute');
        const attributeValue = currentGraph.getNodeDataValue(nodeId, attributeName);
        const bins = histogram.getElementsByTagName("rect");
        d3.selectAll(bins)
            .style("fill", function (d) {
                if (d.x0 <= attributeValue && d.x1 > attributeValue) {
                    return "red";
                }
                return "#ffeead";
            });
    }
}

const showNodeNeighbors = function (nodeId) {
    const neighborsContainer = document.getElementById("node-neighbors-section");

    const neighborsHeadlineElement = neighborsContainer.firstElementChild;
    neighborsHeadlineElement.innerHTML = `Node \"${nodeId}\" neighbors`;

    createNeighborHeadings(nodeId);
    
}

const createNeighborHeadings = function (nodeId) {
    const neighborsGridElement = d3.select("#neighbors-nav");
    neighborsGridElement.html("");
    const headingData = [];

    for (const link of currentGraph.links) {
        let neighbor = null;
        if (link.source.id === nodeId) {
            neighbor = link.target;
        }
        if (link.target.id === nodeId) {
            neighbor = link.source;
        }

        if (neighbor != null) {
            const { id: neighborId, index: neighborIndex } = neighbor;
            headingData.push({
                nodeId: neighborId,
                index: neighborIndex
            })
        }
        
    }

    neighborsGridElement
        .on("click", function () {
            const { nodeId, index } = d3.event.target.__data__;
            nodeHeadingClick(nodeId, index);
        })
        .selectAll("div")
        .data(headingData)
        .enter()
        .append("div")
            .classed("node-heading", true)
            .attr("role", "tab")
            .attr("id", (d) => `neighbor-heading-${d.nodeId}` )
            .append("h5")
                .html((d) => d.nodeId);

}




