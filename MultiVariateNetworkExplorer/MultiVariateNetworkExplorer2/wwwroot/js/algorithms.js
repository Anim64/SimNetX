const shortestPathsBFS = function (graph) {
    const paths = {};
    const visited = {};
    const { nodes, nodes: { length }, linkedByIndex } = graph;
    
    for (const node1 of nodes) {

        const node1Id = node1.id;
        paths[node1Id] = {}
        visited[node1Id] = {};

        for (const node2 of graph.nodes) {

            const node2Id = node2.id;
            paths[node1Id][node2Id] = Infinity;
            visited[node1Id][node2Id] = false;
        }
    }

    for (const [i, node] of nodes.entries()) {
        const src = node.id;
        paths[src][src] = 0;
        visited[src][src] = true;

        const q = new Queue();
        q.enqueue(src);

        while (!q.isEmpty) {
            const u = q.dequeue();

            for (let j = 0; j < length; j++) {
                const v = nodes[j].id;
                if (visited[src][v] === false && (linkedByIndex[u + "," + v] || linkedByIndex[v + "," + u])) {
                    visited[src][v] = true;
                    paths[src][v] = paths[v][src] = paths[src][u] + 1;
                    q.enqueue(v);
                }
            }
        }

    }

    return paths;
}