const calculateClusteringCoefficient = function (graph) {
    const clustering_coef = {
        'average': -1,
        'min': Number.MAX_VALUE,
        'max': Number.MIN_VALUE,
        'values': {}
    };

    const { nodes, links } = graph;
    const adjacencyDictionary = {};

    for (const node of nodes) {
        adjacencyDictionary[node.id] = {};
    }

    for (const link of links) {
        const { source, target } = link;
        const { id: sourceId } = source;
        const { id: targetId } = target;
        adjacencyDictionary[sourceId][targetId] = adjacencyDictionary[targetId][sourceId] = 1;
    }

    for (const [node, neighbors] of Object.entries(adjacencyDictionary)) {
        const neighborIds = Object.keys(neighbors);
        const neighborsCount = neighborIds.length;
        let nodeClusteringCoef = 0;
        if (neighborsCount > 1) {
            for (let i = 0; i < neighborsCount; i++) {
                const neighborId1 = neighborIds[i];
                for (let j = i + 1; j < neighborsCount; j++) {
                    const neighborId2 = neighborIds[j];
                    const areNeighborsConnected = adjacencyDictionary[neighborId1][neighborId2] === 1
                        || adjacencyDictionary[neighborId2][neighborId1] === 1;
                    if (areNeighborsConnected) {
                        nodeClusteringCoef += 2;
                    }
                }
            }
            nodeClusteringCoef /= (neighborsCount * (neighborsCount - 1));
        }
        clustering_coef.values[node] = nodeClusteringCoef;
        clustering_coef.average += nodeClusteringCoef;
        if (nodeClusteringCoef < clustering_coef.min) {
            clustering_coef.min = nodeClusteringCoef;
        }

        if (nodeClusteringCoef > clustering_coef.max) {
            clustering_coef.max = nodeClusteringCoef;
        }
    }

    clustering_coef.average /= Object.keys(clustering_coef.values).length;
    return clustering_coef;

}

onmessage = e => {
    const graph = e.data.graph;
    const clusterCoef = calculateClusteringCoefficient(graph);
    postMessage(clusterCoef);
};