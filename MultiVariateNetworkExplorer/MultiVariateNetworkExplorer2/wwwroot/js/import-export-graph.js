//////////SAVE GRAPH///////////




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

const serializeGraph = function (graph) {
    const serializedGraph = structuredClone(graph);
    const { links } = serializedGraph;

    //for (let i = 0; i < links.length; i++) {
    //    links[i].source = links[i].source.id;
    //    links[i].target = links[i].target.id;
    //}

    for (const link of links) {
        link.source = link.source.id;
        link.target = link.target.id;
    }

    return serializeGraph;
}

const getColourListInputSelector = function (colourListId) {
    return `#${colourListId} input[type=color]`;
}
const serializeGradientColouring = function () {
    const chosenNumAttributeForColouring = document.getElementById("attribute-node-colouring").value;
    const gPointers = d3.selectAll("#stop-colour-pointers polygon");

    const gradientPointerData = [];
    
    gPointers.each(function (d) {
        gradientPointerData.push(d.x);
    });

    const gradientAxisColours = [];
    const gradientAxisColourInputs = document.querySelectorAll(getColourListInputSelector("numerical-colour-list"));
    for (const colourInput of gradientAxisColourInputs) {
        gradientAxisColours.push(colourInput.value);
    }

    const gradientColouringObject = {
        "attribute": chosenNumAttributeForColouring,
        "pointers": {
            "data": gradientPointerData,
        },
        "colours": gradientAxisColours
    }

    return gradientColouringObject;
}

const serializeColourList = function (colourListId) {
    const colourList = document.getElementById(colourListId);
    const colorListItems = colourList.getElementsByTagName("li");
    const colours = [];

    for (const colourListItem of colorListItems) {
        const colourObject = {
            "value": colourListItem.querySelector("label").textContent,
            "colour": colourListItem.querySelector("input").value
        }
        colours.push(colourObject);
    }

    return colours;
}

const serializeCategoryColouring = function () {
    const chosenNumAttributeForColouring = document.getElementById("categorical-attribute-node-colouring").value;
    const categoricalColours = serializeColourList("categorical-colour-list");

    const categoricalColouringObject = {
        "attribute": chosenNumAttributeForColouring,
        "colours": categoricalColours 
    }

    return categoricalColouringObject;
}



const serializePartitionColouring = function () {
    const partitionColours = serializeColourList("partition-colour-list")

    const partitionColouringObject = {
        "colours": partitionColours
    }

    return partitionColouringObject;
}

const serializeClassColouring = function () {
    const partitionColours = serializeColourList("class-colour-list")

    const classColouringObject = {
        "colours": partitionColours
    }

    return classColouringObject;
}

const serializeVisuals = function () {
    const monoColour = document.getElementById("network-colour-input").value;
    const gradientColourObject = serializeGradientColouring();
    const categoricalColourObject = serializeCategoryColouring();
    const partitionColourObject = serializePartitionColouring();
    const classColourObject = serializeClassColouring();

    const visualsObject = {
        "monoColour": monoColour,
        "gradient": gradientColourObject,
        "categorical": categoricalColourObject,
        "partition": partitionColourObject,
        "class": classColourObject
    }

    return visualsObject;
}

const serializeNetworkAndSettings = function () {
    const serializedCurrentGraph = currentGraph.serialize();
    const serializedSelectionGraph = serializeGraph(selectionGraph);
    const filters = serializeFilters();
    const visuals = serializeVisuals();

    const currentGraphObject = {
        "graph": serializedCurrentGraph,
        "selectionGraph": serializedSelectionGraph,
        "filters": filters,
        "filterNodeList": filterNodeList,
        "visuals": visuals,
        //"nodeVisualProperties": nodeVisualProperties
    }


    const stateJson = {
        "currentGraph": currentGraphObject,
        /*"data": dataStore.serialize()*/
    }

    return stateJson;
}

const saveGraph = function (fileName) {
    var a = document.createElement("a");
    const stateJson = serializeNetworkAndSettings();
    var file = new Blob([JSON.stringify(stateJson, null, 2)], { type: "application/json" });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

//////////////////LOAD GRAPH/////////////////////////

const loadNetwork = async function (fileName) {

    //DELETE RETURN LATER TO ENABLE FUNCTION!!!!!!
    return;
    var reader = new FileReader();
    reader.onload = function (e) {
        deleteGraphElementsAndControls();
        
        //var json = JSON.parse(e.target.result);
        //forceProperties = json.forceProperties;
        //filters = json.filters;
        //filterNodeList = json.filterNodeList;
        //graph = json.graph;
        //store = json.store;


        
        //selectionGraph = json.selectionGraph;
        //drawSelectionNetwork(selectionGraph);
        //selectionGraph.nodes.forEach(function (d) {
        //    addSelectionDiv(d);
        //});

        //generateGraphControlAndElements(store, forceProperties, filters);
        //gDraw.html("");
        //drawNetwork(graph);
        //updateForces(false);
        //simulationEnd();


        //// TODO: Load Metrics from json file
        //calculateAllMetrics();

        

        
        //if (!forceProperties.attributeColouring.enabled) {
        //    setDefaultNodeAndLinkColour(node, link);
        //}

        //updateHeadingColour(graph.nodes);

        
        
        
    };
    reader.readAsText(fileName);

    
    //alert(fileName);
    

    //alert(json.graph.nodes.length);
}