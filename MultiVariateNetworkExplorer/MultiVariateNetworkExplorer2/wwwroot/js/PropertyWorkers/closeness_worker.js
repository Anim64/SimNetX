self.importScripts('../algorithms.js', '../queue.js');

const calculateClosenessCentrality = function (graph) {
    const closeness = {
        'average': -1,
        'min': Number.MAX_VALUE,
        'max': Number.MIN_VALUE,
        'values': {}
    };

    const paths = shortestPathsBFS(graph);
    let averageCloseness = 0;
    const { nodes: { length }, nodes} = graph;
    for (const node1 of nodes) {
        const node1ID = node1.id;
        let nodeCloseness = 0;
        let nodesReached = -1;
        for (const node2 of nodes) {
            const node2ID = node2.id;
            const distance = paths[node1ID][node2ID];
            if (distance !== Infinity) {
                nodesReached += 1;
                nodeCloseness += paths[node1ID][node2ID];
            }
        }

        nodeCloseness = nodeCloseness > 0 ? (nodesReached * nodesReached) / ((length - 1) * nodeCloseness) : 0;
        averageCloseness += nodeCloseness;
        closeness.values[node1ID] = nodeCloseness.toFixed(3);
        if (nodeCloseness < closeness.min) {
            closeness.min = nodeCloseness;
        }

        if (nodeCloseness > closeness.max) {
            closeness.max = nodeCloseness;
        }
    }

    averageCloseness /= length;
    closeness.average = averageCloseness;

    return closeness;

}

onmessage = e => {
    const graph = e.data.graph;
    const linkedByIndex = e.data.linksDict;
    const closeness = calculateClosenessCentrality(graph, linkedByIndex);

    postMessage(closeness);
};