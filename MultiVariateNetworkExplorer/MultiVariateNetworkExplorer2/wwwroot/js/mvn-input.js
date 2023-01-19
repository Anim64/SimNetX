const toggleNetworkInput = function () {
    $("#mvn-input-section").toggleClass("active-block");
    hideAllInputForms();
}

const hideAllInputForms = function () {
    $("#mvn-input-section form.active-flex").removeClass('active-flex');
}

const openNetworkInputForm = function (formId) {
    toggleNetworkInput();
    $("#" + formId).addClass("active-flex");
}



const addCollapsibleEventListeners = function () {
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

const addFileButtonsEventListeners = function () {
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

const selectFocusIn = function (select_element) {
    select_element.style.textAlign = "left";
}

const selectFocusOut = function (select_element) {
    select_element.style.textAlign = "center";
}

const recalculateCollapsibleContentHeight = function (collapsible_content_id) {
    const content = document.getElementById(collapsible_content_id);
    content.style.height = "auto";
}

const hideConversionParameters = function (parameter_container, parameter_div_class) {
    const parameters_divs = parameter_container.querySelectorAll("." + parameter_div_class);

    for (const parameters_div of parameters_divs) {
        parameters_div.style.display = "none";

        const inputs = parameters_div.querySelectorAll("input");
        for (const input of inputs) {
            input.disabled = true;
        }
    }
}

const displayParametersElements = function (parameter_container, parameter_div_id) {
    const parameters_div = parameter_container.querySelector("#" + parameter_div_id);

    parameters_div.style.display = "grid";

    const inputs = parameters_div.querySelectorAll("input");
    for (const input of inputs) {
        input.disabled = false;
    }
}

const displayMetricParameters = function (metricSelectId) {

    const metric_select = document.getElementById(metricSelectId);

    const metric_select_value = metric_select.value;
    const parameter_container = metric_select.nextElementSibling;

    switch (metric_select_value) {

        case "GaussKernel": {
            hideConversionParameters(parameter_container, "metric-parameters");
            displayParametersElements(parameter_container, "gauss-parameters");
            break;
        }
        default: {
            hideConversionParameters(parameter_container, "metric-parameters");
            break;
        }


    }

    //recalculateCollapsibleContentHeight("conversion-collapsible-content");
}

const displayAlgorithmParameters = function (algorithmSelectId) {
    const algorithm_select = document.getElementById(algorithmSelectId);
    const algorithm_select_value = algorithm_select.value;
    const parameter_container = algorithm_select.nextElementSibling;
    switch (algorithm_select_value) {

        case "EpsilonKNN": {
            hideConversionParameters(parameter_container, "algorithm-parameters");
            displayParametersElements(parameter_container, "epsilon-parameters");
            break;
        }

        default: {
            hideConversionParameters(parameter_container, "algorithm-parameters");
            break;
        }


    }

    //recalculateCollapsibleContentHeight("conversion-collapsible-content");
}

//const displayInputMetricParameters = function (metricSelectId) {

//    const metric_select_value = document.getElementById("metric").value;

//    switch (metric_select_value) {

//        case "GaussKernel": {
//            hideConversionParameters("input-metric-parameters");
//            displayParametersElements("input-gauss-parameters", "input-metric-parameters-headline");
//            break;
//        }
//        default: {
//            hideConversionParameters("input-metric-parameters");
//            break;
//        }


//    }

//    recalculateCollapsibleContentHeight("conversion-collapsible-content");
//}

//const displayInputAlgorithmParameters = function () {
//    const algorithm_select_value = document.getElementById("convert").value;

//    switch (algorithm_select_value) {

//        case "EpsilonKNN": {
//            hideConversionParameters("input-algorithm-parameters");
//            displayParametersElements("input-epsilon-parameters", "input-algorithm-parameters-headline");
//            break;
//        }

//        default: {
//            hideConversionParameters("input-algorithm-parameters");
//            break;
//        }


//    }

//    recalculateCollapsibleContentHeight("conversion-collapsible-content");
//}

const prepareInputForm = function () {
    addFileButtonsEventListeners();
    addCollapsibleEventListeners();
    displayMetricParameters("metric");
    displayAlgorithmParameters("convert");
    displayMetricParameters("append-metric");
    displayAlgorithmParameters("append-convert");

    const mvn_input_section = document.getElementById("mvn-input-section");
    mvn_input_section.addEventListener("click", toggleNetworkInput);
    for (const form of mvn_input_section.querySelectorAll("form")) {
        form.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }
    $("#mvn-append-form").submit(function (e) {
        const current_graph_input = e.currentTarget.querySelector("#currentGraph");
        current_graph_input.value = JSON.stringify(store);
        //console.log(current_graph_input.value);
    });

}

const isNullOrEmpty = function (string) {
    return string === null || string === "";
}

const validateNewNetworkForm = function (form) {
    let isValid = true;
    let errorMessage = "";

    const vectorFile = form.querySelector("#fileVector").value;
    if (isNullOrEmpty(vectorFile)) {
        errorMessage += "Please insert the vector file.<br>";
        isValid = false;
    }

    const separators = form.querySelector("#separators").value;
    if (isNullOrEmpty(separators)) {
        errorMessage += "Please enter the data separating character.<br>";
        isValid = false;
    }

    const missingValues = form.querySelector("#missingvalues").value;
    if (isNullOrEmpty(missingValues)) {
        errorMessage += "Please enter the string which will represents missing values.<br>";
        isValid = false;
    }

    const errorParagraph = form.querySelector("#new-network-error-para");
    errorParagraph.innerHTML = errorMessage;
    
    return isValid;
}

const validateAppendNetworkForm = function (form) {
    let isValid = true;
    let errorMessage = "";

    if (graph.nodes.length <= 0) {
        errorMessage += "There is no graph to append to.<br>";
        isValid = false;
    }

    const vectorFile = form.querySelector("#fileVectorAppend").value;
    if (isNullOrEmpty(vectorFile)) {
        errorMessage += "Please insert the vector file.<br>";
        isValid = false;
    }

    const separators = form.querySelector("#separatorsAppend").value;
    if (isNullOrEmpty(separators)) {
        errorMessage += "Please enter the data separating character.<br>";
        isValid = false;
    }

    const missingValues = form.querySelector("#missingvaluesAppend").value;
    if (isNullOrEmpty(missingValues)) {
        errorMessage += "Please enter the string which will represents missing values.<br>";
        isValid = false;
    }

    const errorParagraph = form.querySelector("#append-network-error-para");
    errorParagraph.innerHTML = errorMessage;

    return isValid;
}