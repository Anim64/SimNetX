//Display Metric
const displayPartitionMetric = function () {
    const metric = document.getElementById("partition-metric-select").value;

    $("#partition-metrics>.partition-metric-wrapper").removeClass("active-block");
    document.getElementById(`partition-metric-${metric}-container`).classList.add("active-block");
}


//Partition attribute boxplots

const generatePartitionBoxplots = function () {
    const attributeName = document.getElementById("partition-metric-boxplot-attribute-select").value;

    const partitionMetricContainer = d3.select("#partition-metric-boxplot-graph-container").html("");
    const clusterDivs = d3.selectAll("#list-selections div");

    if (clusterDivs.size() > 0) {
        const partitionStats = d3.nest()
            .key(function (d) { return currentGraph.getPartition(d.id) })
            .rollup(function (d) {
                q1 = d3.quantile(d.map(function (g) {
                    return currentGraph.getNodeDataValue(g.id, attributeName);
                }).sort(d3.ascending), .25);
                median = d3.quantile(d.map(function (g) { return currentGraph.getNodeDataValue(g.id, attributeName); }).sort(d3.ascending), .5);
                q3 = d3.quantile(d.map(function (g) { return currentGraph.getNodeDataValue(g.id, attributeName); }).sort(d3.ascending), .75);
                IQRValue = q3 - q1;
                min = q1 - 1.5 * IQRValue
                max = q3 + 1.5 * IQRValue; 
                return ({ q1: q1, median: median, q3: q3, "IQR": IQRValue, min: min, max: max });
            })
            .entries(currentGraph.nodes);


        const splitCount = 5;
        for (let i = 0; i < partitionStats.length; i += splitCount) {
            const splitData = partitionStats.slice(i, i + splitCount);
            const boxplotContainerDiv = partitionMetricContainer
                .append("div")
                .attr("id", `partition-metric-boxplot-graph-container-${i}-div`)
                .style("position", "relative");
            boxplot(boxplotContainerDiv, splitData, 1270, 400, i);
        }

        const colourObject = contructColourObjectFromList("partition-colour-list");
        updateBoxplotColour(partitionMetricContainer, colourObject);
    }
    
}