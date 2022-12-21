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

const recalculateCollapsibleContentHeight = function (collapsible_content_id) {
    const content = document.getElementById(collapsible_content_id);
    content.style.height = "auto";
}

const hideConversionParameters = function (parameter_div_class) {
    const parameters_divs = document.getElementsByClassName(parameter_div_class);
    for (const parameters_div of parameters_divs) {
        parameters_div.style.display = "none";

        const inputs = parameters_div.querySelectorAll("input");
        for (const input of inputs) {
            input.disabled = true;
        }
    }
}

const displayParametersElements = function (parameter_div_id, parameter_div_headline) {
    const parameters_div = document.getElementById(parameter_div_id);
    const algorithm_parameters_headline = document.getElementById(parameter_div_headline);

    algorithm_parameters_headline.style.display = "block";
    parameters_div.style.display = "grid";

    const inputs = parameters_div.querySelectorAll("input");
    for (const input of inputs) {
        input.disabled = false;
    }
}

const displayMetricParameters = function (metricSelectId) {

    const metric_select_value = document.getElementById("metric").value;

    switch (metric_select_value) {
        
        case "GaussKernel": {
                hideConversionParameters("metric-parameters");
                displayParametersElements("gauss-parameters", "metric-parameters-headline");
                break;
        }
        default: {
            hideConversionParameters("metric-parameters");
            break;
        }
        
            
    }

    recalculateCollapsibleContentHeight("conversion-collapsible-content");
}

const displayAlgorithmParameters = function () {
    const algorithm_select_value = document.getElementById("convert").value;

    switch (algorithm_select_value) {
        
        case "EpsilonKNN": {
                hideConversionParameters("algorithm-parameters");
                displayParametersElements("epsilon-parameters", "algorithm-parameters-headline");
                break;
        }

        default: {
            hideConversionParameters("algorithm-parameters");
            break;
        }
        

    }

    recalculateCollapsibleContentHeight("conversion-collapsible-content");
}



window.addEventListener('load', function () {
    addFileButtonsEventListeners();
    addCollapsibleEventListeners();
    displayMetricParameters();
    displayAlgorithmParameters();
})