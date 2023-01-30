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
    document.addEventListener('click', closeAllRemodelPanels);

    prepareInputForm();
    calculateAllMetrics();


    selectionNode.each(function (d) {
        setGroupColour(d);
    });

    displayAlgorithmParameters("remodel-algorithm-select");
    displayMetricParameters("remodel-metric-select");

});






