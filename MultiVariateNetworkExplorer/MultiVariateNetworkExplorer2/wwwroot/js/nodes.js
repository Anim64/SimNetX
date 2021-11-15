function toggleNodeDetails(nodeId, headingId, detailsId, nodeRowGroupId) {
    let headingElement = document.getElementById(headingId);
    let detailsElement = document.getElementById(detailsId);

    if (detailsElement.style.display === 'none' || detailsElement.style.display === '') {
        detailsElement.style.display = 'block';
        let inputs = detailsElement.querySelectorAll('input');

        inputs.forEach((input) => {
            let attributeName = input.id.substring(input.id.indexOf('-') + 1, input.id.length);
            input.value = graph.nodes[nodeId][attributeName];
        });

    }

    else {
        if (!headingElement.classList.contains('active-node-heading')) {
            let rowHeadings = $('#' + nodeRowGroupId + ' .active-node-heading');

            rowHeadings.removeClass('active-node-heading');

            let inputs = detailsElement.querySelectorAll('input');

            inputs.forEach((input) => {
                let attributeName = input.id.substring(input.id.indexOf('-') + 1, input.id.length);
                input.value = graph.nodes[nodeId][attributeName];
            });

        }
        else {
            detailsElement.style.display = 'none';
        }
    }

    headingElement.classList.toggle('active-node-heading');
}