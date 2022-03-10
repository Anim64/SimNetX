self.importScripts('../algorithms.js', '../queue.js');

function calculateClosenessCentrality(graph, linkedByIndex) {
    var closeness = {
        'average': -1,
        'min': Number.MAX_VALUE,
        'max': Number.MIN_VALUE,
        'values': {}
    };

    let paths = shortestPathsBFS(graph, linkedByIndex);
    let averageCloseness = 0;
    for (let i = 0; i < graph.nodes.length; i++) {
        let node1ID = graph.nodes[i].id;
        let nodeCloseness = 0;
        for (let j = 0; j < graph.nodes.length; j++) {
            let node2ID = graph.nodes[j].id
            if (node1ID !== node2ID) {
                nodeCloseness += 1 / paths[node1ID][node2ID];
            }
            
        }

        /*nodeCloseness /= graph.nodes.length - 1;*/
        averageCloseness += nodeCloseness;
        closeness.values[node1ID] = nodeCloseness;
        if (nodeCloseness < closeness.min) {
            closeness.min = nodeCloseness;
        }

        if (nodeCloseness > closeness.max) {
            closeness.max = nodeCloseness;
        }
    }

    averageCloseness /= graph.nodes.length;
    closeness.average = averageCloseness;

    return closeness;

}

onmessage = e => {
    const graph = e.data.graph;
    const linkedByIndex = e.data.linksDict;
    const closeness = calculateClosenessCentrality(graph, linkedByIndex);

    postMessage(closeness);
};