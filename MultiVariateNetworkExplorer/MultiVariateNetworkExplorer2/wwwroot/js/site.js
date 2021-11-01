// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.




function openTab(event, contentId, divId, contentClass) {
    var i, tabcontent, tablinks;

    //tabcontent = document.getElementsByClassName("tabcontent");
    tabcontent = document.getElementById(divId).querySelectorAll(contentClass);
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementById(divId).querySelectorAll(".tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" tab-active", "");
    }

    document.getElementById(contentId).style.display = "block";
    event.currentTarget.className += " tab-active";
}



function createDoubleSlider(sliderId, minValueId, maxValueId, minValue, maxValue) {
    $("#" + sliderId).slider({
        range: true,
        min: minValue,
        max: maxValue,
        values: [minValue, maxValue],
        step: 0.01,
        slide: function (event, ui) {
            $("#" + minValueId).val(ui.values[0]);
            $("#" + maxValueId).val(ui.values[1]);

            if (ui.handleIndex === 0) {
                filterByMinValue(ui.value, minValueId.split("-")[0])
            }
            else if (ui.handleIndex === 1) {
                filterByMaxValue(ui.value, maxValueId.split("-")[0])
            }
        }
    });
    //$("#" + minValueId).val($("#" + sliderId).slider("values", 0));
    //$("#" + maxValueId).val($("#" + sliderId).slider("values", 1));
    
}


