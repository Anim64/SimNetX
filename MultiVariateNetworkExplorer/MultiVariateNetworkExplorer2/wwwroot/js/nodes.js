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
const nodeHeadingClick = function (event, nodeId, nodeIndex) {
    selectNode(event, nodeId);
    toggleNodeDetails(nodeId, nodeIndex);
}

const nodeHeadingMouseOver = function (nodeId, opacity) {
    fadeDisconnectedNodes(nodeId, opacity);
}

const selectNode = function (event, nodeId) {
    if (!event.shiftKey) {
        deselectAllNodes();
    }

    const nodeHeadingElement = document.getElementById('heading-' + nodeId);
    nodeHeadingElement.classList.add('node-heading-selected');
    nodeGroups.classed('selected', function (d) {
        return d.selected = d.selected | d.id == nodeId;
    });
}

const toggleNodeDetails = function(nodeId, nodeIndex) {
    const headingElement = document.getElementById('node-detail-heading');
    const detailsElement = document.getElementById("node-detail-container");
    const attributesDiv = document.getElementById("node-attributes");
    const centralitiesDiv = document.getElementById("node-centralities");

    detailsElement.setAttribute('data-id', nodeId)

    headingElement.innerHTML = "Node: " + nodeId;

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



const closeNodeDetails = function (nodeDetailsId) {
    const nodeDetailsDiv = document.getElementById(nodeDetailsId);
    nodeDetailsDiv.style.display = "none";
}


