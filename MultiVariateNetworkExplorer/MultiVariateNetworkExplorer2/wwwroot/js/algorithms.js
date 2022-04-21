const shortestPathsBFS = function (graph, linkedByIndex) {
    const paths = {};
    const visited = {};
    const graphLength = graph.length;

    for (const node1 of graph.nodes) {

        const node1Id = node1.id;
        paths[nodeId] = {}
        visited[nodeId] = {};

        for (const node2 of graph.nodes) {

            const node2Id = node2.id;
            paths[node1Id][node2Id] = Infinity;
            visited[node1Id][node2Id] = false;
        }
    }

    for (const [node] of graph.nodes) {
        const src = node.id;
        paths[src][src] = 0;
        visited[src][src] = true;

        const q = new Queue();
        q.enqueue(src);

        while (!q.isEmpty) {
            const u = q.dequeue();

            for (let j = i; j < graphLength; j++) {
                const v = graph.nodes[j].id;
                if (visited[src][v] === false &&
                    (linkedByIndex[u + "," + v] ||
                        linkedByIndex[v + "," + u] ||
                        u == v)) {
                    visited[src][v] = true;
                    paths[src][v] = paths[v][src] = paths[src][u] + 1;
                    q.enqueue(v);
                }
            }
        }

    }

    return paths;
}