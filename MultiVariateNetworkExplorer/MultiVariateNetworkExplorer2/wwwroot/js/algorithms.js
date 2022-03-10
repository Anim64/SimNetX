function shortestPathsBFS(graph, linkedByIndex) {
    var paths = {};
    let visited = {};

    for (const node1 of graph.nodes) {
        let nodeId = node1.id;
        paths[nodeId] = {}
        visited[nodeId] = {};
        for (const node2 of graph.nodes) {
            paths[nodeId][node2.id] = Infinity;
            visited[nodeId][node2.id] = false;
        }

    }

    for (let i = 0; i < graph.nodes.length; i++) {
        let src = graph.nodes[i].id;
        paths[src][src] = 0;
        visited[src][src] = true;

        let q = new Queue();
        q.enqueue(src);

        while (!q.isEmpty) {
            let u = q.dequeue();

            for (let j = i; j < graph.nodes.length; j++) {
                let v = graph.nodes[j].id;
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