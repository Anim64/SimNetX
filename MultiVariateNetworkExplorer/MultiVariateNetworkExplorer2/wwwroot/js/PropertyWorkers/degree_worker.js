function calculateDegreeCentrality(graph) {
    var degrees = {
        'average': -1,
        'min': Number.MAX_SAFE_INTEGER,
        'max': Number.MIN_SAFE_INTEGER,
        'values': {}};
    var averageDegree = 0;

    for (const link of graph.links) {
        if (!degrees.values.hasOwnProperty(link["source"]["id"])) {
            degrees.values[link["source"]["id"]] = 1;
        }

        else {
            degrees.values[link["source"]["id"]] += 1;
        }

        if (!degrees.values.hasOwnProperty(link["target"]["id"])) {
            degrees.values[link["target"]["id"]] = 1;
        }

        else {
            degrees.values[link["target"]["id"]] += 1;
        }
    }


    for (const node in degrees.values) {
        var current_node_degree = degrees.values[node]
        averageDegree += current_node_degree;

        if (current_node_degree > degrees.max) {
            degrees.max = current_node_degree;
        }

        if (current_node_degree < degrees.min) {
            degrees.min = current_node_degree;
        }

    }

    averageDegree /= graph.nodes.length;
    degrees.average = averageDegree;

    return degrees;
}

onmessage = e => {
    const graph = e.data.graph;
    const degrees = calculateDegreeCentrality(graph);
    
    
    postMessage(degrees);
};