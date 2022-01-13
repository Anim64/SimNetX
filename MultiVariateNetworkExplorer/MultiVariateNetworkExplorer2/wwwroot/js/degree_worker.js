function calculateAverageDegree(graph) {
    var degrees = {
        'average': -1,
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
        averageDegree += degrees.values[node];
    }

    averageDegree /= graph.nodes.length;
    degrees.average = averageDegree;

    return degrees;
}

onmessage = e => {
    const graph = e.data;
    const degrees = calculateAverageDegree(graph);
    postMessage(degrees);
};