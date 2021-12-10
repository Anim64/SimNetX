function addCollapsibleEventListeners() {
    var parameter_collapsibles = document.getElementsByClassName("collapsible-parameters-btn");

    for (var i = 0; i < parameter_collapsibles.length; i++) {
        parameter_collapsibles[i].addEventListener("click", function () {
            this.classList.toggle("collapsible-parameters-btn-active");
            var content = this.nextElementSibling;

            if (content.clientHeight) {
                content.style.height = 0;
            }
            else {
                content.style.height = content.scrollHeight + "px";
            }
        });
    };
}

function addFileButtonsEventListeners() {
    var inputs = document.querySelectorAll('.inputfile');

    Array.prototype.forEach.call(inputs, function (input) {
        var label = input.nextElementSibling,
            labelVal = label.innerHTML;
        var textbox = label.previousElementSibling;

        input.addEventListener('change', function (e) {
            var fileName = '';
            fileName = e.target.value.split('\\').pop();
            if (fileName) {
                label.innerHTML = fileName;
                textbox.innerHTML = fileName;
                label.style.backgroundColor = "green";
                textbox.style.backgroundColor = "green";
            }
            else
                label.innerHTML = labelVal;
        });
    });
}

function selectFocusIn(select_element) {
    select_element.style.textAlign = "left";
}

function selectFocusOut(select_element) {
    select_element.style.textAlign = "center";
}

var select_inputs = document.getElementsByTagName("select");

Array.prototype.forEach.call(select_inputs, function (select_input) {
    //select_input.addEventListener("focus", selectFocusOut(select_input));
    //select_input.addEventListener("focusout", selectFocusOut(select_input));
});


function hideConversionParameters() {
    var conversion_parameters_divs = document.getElementsByClassName("conversion-parameters-div");
    Array.prototype.forEach.call(conversion_parameters_divs, function (conversion_parameters_div) {
        conversion_parameters_div.style.display = "none";
    });
}
function recalculateCollapsibleContentHeight(collapsible_content_id) {
    var content = document.getElementById(collapsible_content_id);
    content.style.height = "auto";
}
function displayConversionParameters(conversion_alg) {
    
    hideConversionParameters();
    var conversion_parameters_headline = document.getElementById("conversion-parameters-headline");

    if (conversion_alg === "1") {
        var epsilon_parameters_div = document.getElementById("epsilon-parameters");
        epsilon_parameters_div.style.display = "grid";
        conversion_parameters_headline.style.display = "block";
    }

    else {
        conversion_parameters_headline.style.display = "none";
    }

    recalculateCollapsibleContentHeight("conversion-collapsible-content");
}

window.addEventListener('load', function () {
    addFileButtonsEventListeners();
    addCollapsibleEventListeners();
})