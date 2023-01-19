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

    const savedGraph = structuredClone(graph);
    const { links } = savedGraph;

    for (let i = 0; i < links.length; i++) {
        links[i].source = links[i].source.id;
        links[i].target = links[i].target.id;
    }
    stateJson.graph = savedGraph;


    const savedSelectionGraph = structuredClone(selectionGraph);
    const { links: selectionLinks } = savedSelectionGraph;
    for (let i = 0; i < selectionLinks.length; i++) {
        selectionLinks[i].source = selectionLinks[i].source.id;
        selectionLinks[i].target = selectionLinks[i].target.id;
    }
    stateJson.selectionGraph = savedSelectionGraph;

    stateJson.forceProperties = forceProperties;

    const filters = serializeFilters();
    stateJson.filters = filters;
    stateJson.filterNodeList = filterNodeList;

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
            "min": parseFloat(minInput.min),
            "max": parseFloat(maxInput.max),
            "lowValue": parseFloat(minInput.value),
            "highValue": parseFloat(maxInput.value)
        };
        resultFilters.push(filterJson);
    }
    parseFloat()
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

    return resultFilters;
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

const loadNetwork = async function (fileName) {
    var reader = new FileReader();
    reader.onload = function (e) {
        deleteGraphElementsAndControls();

        
        
        updateSelectionNodesAndLinks();
        var json = JSON.parse(e.target.result);
        forceProperties = json.forceProperties;
        filters = json.filters;
        filterNodeList = json.filterNodeList;
        graph = json.graph;
        store = json.store;


        
        selectionGraph = json.selectionGraph;
        drawSelectionNetwork(selectionGraph);
        selectionGraph.nodes.forEach(function (d) {
            addSelectionDiv(d);
        });

        generateGraphControlAndElements(store, forceProperties, filters);
        gDraw.html("");
        drawNetwork(graph);
        updateForces(false);
        simulationEnd();


        // TODO: Load Metrics from json file
        calculateAllMetrics();

        

        
        if (!forceProperties.attributeColouring.enabled) {
            updateNodeAndLinkColour(node, link);
        }

        updateHeadingColour(graph.nodes);

        
        
        
    };
    reader.readAsText(fileName);

    
    //alert(fileName);
    

    //alert(json.graph.nodes.length);
}