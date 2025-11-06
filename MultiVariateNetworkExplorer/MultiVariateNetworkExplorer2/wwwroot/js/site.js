/*!
 * Copyright (c) 2025 Tomas Anlauf
 * Licensed under the MIT License
 */

const openTab = function (event, contentId, divId, contentClass) {
    const tabcontents = document.getElementById(divId).querySelectorAll(contentClass);
    for (const tabcontent of tabcontents) {
        tabcontent.classList.remove("active-block");
    }

    const tablinks = document.getElementById(divId).querySelectorAll(".tab-link");
    for (const tablink of tablinks) {
        tablink.className = tablink.className.replace(" tab-active", "");
    }

    document.getElementById(contentId).classList.add("active-block");
    event.currentTarget.className += " tab-active";
}

const getJsonValue = function (obj, stringPath) {
    let result = stringPath.split('.').reduce(function (o, k) {
        return o && o[k];
    }, obj);
    return result;
}

const cancelDefaultBehaviour = function (e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
}

const removeSpacesAndCommas = function (inputString) {
    return inputString.replace(/[\s,]+/g, '-');
}

const clearElement = function (id) {
    document.getElementById(id).innerHTML = "";
}

const switchElement = function (groupClass, activeId, diplayType) {
    $(`.${groupClass}`).css("display", "none");
    document.getElementById(activeId).style.display = diplayType;
}

window.addEventListener("load", function () {
    //$('.collapse.in').prev('.panel-heading').addClass('active');
    //$('#accordion')
    //    .on('show.bs.collapse', function (a) {
    //        $(a.target).prev('.panel-heading').addClass('active');
    //    })
    //    .on('hide.bs.collapse', function (a) {
    //        $(a.target).prev('.panel-heading').removeClass('active');
    //    });

    document.addEventListener('click', closeAllToolbarPanels);
    //initiateEventHandlers();
    
    prepareInputForm();
    calculateAllMetrics();

    prepareNodeDatalist();

    const { num: numAttributes = [] } = currentGraph.attributes;
    for (const attribute of numAttributes) {
        const containerDivId = `${attribute}-histogram-container`;
        const attributeValues = currentGraph.getAllAttributeValues(attribute);

        hist(containerDivId, attributeValues, attribute, 300, 100);
        
    }

    updateRemodelOptionsHeader("remodel-attribute-panel-header", "remodel-network-select");
    displayAlgorithmParameters("remodel-algorithm-select", "-parameters-remodel");
    displayMetricParameters("remodel-metric-select");

    addSelectionDivs(selectionGraph);
    updateSelectionNodesAndLinks();
    updatePartitionColours();
    updatePartitionColourList();
    setPartitionColouring("partition-colour-list");

});






