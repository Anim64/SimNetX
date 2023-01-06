//////////SAVE GRAPH///////////


const saveGraph = function (fileName) {
    var a = document.createElement("a");
    const stateJson = serializeGraph();
    var file = new Blob([JSON.stringify(stateJson, null, 2)], { type: "application/json" });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

const serializeGraph = function () {
    const stateJson = {};
    stateJson.store = store;
    stateJson.graph = graph;
    stateJson.forceProperties = forceProperties;

    const filters = serializeFilters();
    stateJson.filters = filters;

    return stateJson;

}

const serializeNumericFilters = function (filterDiv) {
    const numericFilters = filterDiv.getElementsByClassName('numeric');

    const resultFilters = [];
    for (const numericFilter of numericFilters) {
        const attributeName = numericFilter.querySelector('h4').innerHTML;
        const minInput = numericFilter.querySelector("#" + attributeName + "-sliderOutputMin");
        const maxInput = numericFilter.querySelector("#" + attributeName + "-sliderOutputMax");
        const filterJson = {
            "attribute": attributeName,
            "min": minInput.min,
            "max": maxInput.max,
            "lowValue": minInput.value,
            "highValue": maxInput.value
        };
        resultFilters.push(filterJson);
    }

    return resultFilters;
}

const serializeCategoricalFilters = function (filterDiv) {
    const categoricalFilters = filterDiv.getElementsByClassName('categorical');

    const resultFilters = [];
    for (const categoricalFilter of categoricalFilters) {
        const attributeName = categoricalFilter.querySelector('h4').innerHTML;
        const checkboxes = categoricalFilter.querySelectorAll('input');
        const filterJson = {
            "attribute": attributeName,
            "categories": {}
        }
        for (const checkbox of checkboxes) {
            const category = checkbox.value;
            const checked = checkbox.checked;
            filterJson.categories[category] = checked;
        }

        resultFilters.push(filterJson);
    }
}

const serializeFilters = function () {
    const filterDiv = document.getElementById('attributes');

    const filters = {
        "numeric": serializeNumericFilters(filterDiv),
        "categorical": serializeCategoricalFilters(filterDiv)
    };

    return filters;
}


//////////////////LOAD GRAPH/////////////////////////