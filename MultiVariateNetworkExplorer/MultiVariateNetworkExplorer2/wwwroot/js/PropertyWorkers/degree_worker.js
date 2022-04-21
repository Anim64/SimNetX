const calculateDegreeCentrality = function(graph) {
    const degrees = {
        'average': -1,
        'min': Number.MAX_SAFE_INTEGER,
        'max': Number.MIN_SAFE_INTEGER,
        'values': {}};
    const { values } = degrees;

    for (const link of graph.links) {
        const { source: { id: sourceId }, target: { id: targetId } } = link;

        degrees.values[sourceId] = !values.hasOwnProperty(sourceId) ? 1 : values[sourceId] + 1;
        degrees.values[targetId] = !values.hasOwnProperty(targetId) ? 1 : values[targetId] + 1;
    }

    let averageDegree = 0;
    for (const node in values) {
        const current_node_degree = values[node];
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