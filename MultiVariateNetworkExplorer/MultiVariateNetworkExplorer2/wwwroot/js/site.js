// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.




const openTab = function (event, contentId, divId, contentClass) {

    const hello = document.getElementById(divId);
    const tabcontents = document.getElementById(divId).querySelectorAll(contentClass);
    for (const tabcontent of tabcontents) {
        tabcontent.style.display = "none";
    }

    const tablinks = document.getElementById(divId).querySelectorAll(".tab-link");
    for (const tablink of tablinks) {
        tablink.className = tablink.className.replace(" tab-active", "");
    }

    document.getElementById(contentId).style.display = "block";
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



window.addEventListener("load", function () {
    $('.collapse.in').prev('.panel-heading').addClass('active');
    $('#accordion')
        .on('show.bs.collapse', function (a) {
            $(a.target).prev('.panel-heading').addClass('active');
        })
        .on('hide.bs.collapse', function (a) {
            $(a.target).prev('.panel-heading').removeClass('active');
        });

    document.addEventListener('click', closeAllToolbarPanels);
    //initiateEventHandlers();
    
    prepareInputForm();
    calculateAllMetrics();

    prepareNodeDatalist();
    selectionNode.each(function (d) {
        setGroupColour(d);
    });

    const { num: numAttributes = [] } = currentGraph.attributes;
    for (const attribute of numAttributes) {
        const containerDivId = attribute + "-histogram-container";

        hist(containerDivId, currentGraph, attribute);
        
    }


    changeAttributeCategoryColouringList('categorical-attribute-node-colouring', 'categorical-colour-list');

    updateRemodelOptionsHeader("remodel-attribute-panel-header", "remodel-network-select");
    displayAlgorithmParameters("remodel-algorithm-select", "-parameters-remodel");
    displayMetricParameters("remodel-metric-select");

});






