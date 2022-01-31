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
function nodeHeadingClick(event, nodeId) {
    selectNode(event, nodeId);
    toggleNodeDetails(nodeId);
}

function nodeHeadingMouseOver(nodeId, opacity) {
    fadeDisconnectedNodes(nodeId, opacity);
}

function selectNode(event, nodeId) {
    if (!event.shiftKey) {
        deselectAllNodes();
    }

    let nodeHeadingElement = document.querySelector('#heading-' + nodeId);
    nodeHeadingElement.classList.add('node-heading-selected');
    node.classed('selected', function (d) {
        return d.selected = d.selected | d.id == nodeId;
    });
}

function toggleNodeDetails(nodeId) {
    let headingElement = document.getElementById('node-detail-heading');
    let detailsElement = document.getElementById("node-detail-container");


    headingElement.innerHTML = "Node: " + nodeId;

    if (detailsElement.style.display === 'none' || detailsElement.style.display === '') {
        detailsElement.style.display = 'block';
    }

    let inputs = detailsElement.querySelectorAll('input');

    inputs.forEach((input) => {
        //let attributeName = input.id.substring(input.id.indexOf('-') + 1, input.id.length);
        let attributeName = input.getAttribute('data-attribute');
        input.value = graph.nodes[nodeId][attributeName];
    });
}



function closeNodeDetails(nodeDetailsId) {
    var nodeDetailsDiv = document.querySelector('#' + nodeDetailsId);
    nodeDetailsDiv.style.display = "none";
}