const addCollapsibleEventListeners = function() {
    const parameter_collapsibles = document.getElementsByClassName("collapsible-parameters-btn");

    for (const parameter_collapsible of parameter_collapsibles) {
    //for (let i = 0; i < parameter_collapsibles.length; i++) {
        parameter_collapsible.addEventListener("click", function () {
            this.classList.toggle("collapsible-parameters-btn-active");
            const content = this.nextElementSibling;

            content.style.height = content.clientHeight ? 0 : content.scrollHeight + "px";
        });
    };
}

const addFileButtonsEventListeners = function() {
    const inputs = document.getElementsByClassName('inputfile');

    for (const input of inputs) {
    
        const label = input.nextElementSibling;
        const labelVal = label.innerHTML;
        const textbox = label.previousElementSibling;

        input.addEventListener('change', function (e) {
            let fileName = '';
            fileName = e.target.value.split('\\').pop();
            if (fileName) {
                label.innerHTML = textbox.innerHTML = fileName;
                label.style.backgroundColor = textbox.style.backgroundColor = "green";
            }
            else
                label.innerHTML = labelVal;
        });
    }
}

const selectFocusIn = function(select_element) {
    select_element.style.textAlign = "left";
}

const selectFocusOut = function(select_element) {
    select_element.style.textAlign = "center";
}


const hideConversionParameters = function() {
    const conversion_parameters_divs = document.getElementsByClassName("conversion-parameters-div");
    for (const conversion_parameters_div of conversion_parameters_divs) {
        conversion_parameters_div.style.display = "none";
    }
}

const recalculateCollapsibleContentHeight = function(collapsible_content_id) {
    const content = document.getElementById(collapsible_content_id);
    content.style.height = "auto";
}

const displayConversionParameters = function(conversion_alg) {
    
    hideConversionParameters();
    const conversion_parameters_headline = document.getElementById("conversion-parameters-headline");

    if (conversion_alg === "1") {
        const epsilon_parameters_div = document.getElementById("epsilon-parameters");
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