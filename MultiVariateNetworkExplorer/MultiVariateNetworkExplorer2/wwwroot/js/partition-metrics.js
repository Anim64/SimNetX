//*****Display Metric******
const displayPartitionMetric = function () {
    const metric = document.getElementById("partition-metric-select").value;

    $("#partition-metrics>.partition-metric-wrapper").removeClass("active-block");
    document.getElementById(`partition-metric-${metric}-container`).classList.add("active-block");
}

//*******Silhouette barplots**********
const requestSilhouette = function () {
    //const graph_string = JSON.stringify(graph);
    const excludedAttributes = $("#remodel-inactive-attributes-select option")
        .map(function () {
            return $(this).val();
        }).get();


    const nodes_string = JSON.stringify(dataStore.nodeData);
    const attributes_string = JSON.stringify(currentGraph.attributes);
    const partitions_string = JSON.stringify(currentGraph.partitions);
    const excluded_attributes_string = JSON.stringify(excludedAttributes);
    const metric_string = JSON.stringify(currentGraph.metric);

    $.ajax({
        url: 'GetSilhouette',
        type: 'POST',
        dataType: 'json',
        // It is important to set the content type
        // request header to application/json because
        // that's how the client will send the request
        contentType: "application/x-www-form-urlencoded",
        data: {
            nodes: nodes_string,
            attributes: attributes_string,
            partitions: partitions_string,
            excludedAttributes: excluded_attributes_string,
            metric: metric_string
        },
        //cache: false,
        success: function (result) {
            const silhouetteData = JSON.parse(result.silhouetteData);
            const clusterDivs = d3.selectAll("#list-selections div");
            if (clusterDivs.size() > 0) {
                silhouetteData.sort((a, b) => { return b.y - a.y });
                const silhouetteDataGroupedByPartition = {};
                const clusterColours = {}
                clusterDivs.each(function (d) {
                    const { id } = d;
                    silhouetteDataGroupedByPartition[id] = [];
                    clusterColours[id] = d3.select(this).style("background-color");
                });

                const nodeColoursByPartition = {};

                for (const node of silhouetteData) {
                    const { x: nodeId } = node;
                    const nodePartition = currentGraph.getPartition(node.x);
                    silhouetteDataGroupedByPartition[nodePartition].push(node);
                    nodeColoursByPartition[nodeId] = clusterColours[nodePartition];
                }

                

                const clusterMetricContainer = d3.select("#partition-metric-silhouette-graph-container").html("");

                clusterDivs
                    .each(function (d) {
                        const clusterMetricDiv = clusterMetricContainer.append("div");
                        //addMccTable(clusterMetricDiv, d.id, mccObject);
                        const titleColour = d3.select(this).style("background-color");
                        const { id: clusterId } = d;
                        addSilhouettePlot(clusterMetricDiv, clusterId, silhouetteDataGroupedByPartition[clusterId], titleColour, titleColour);
                    });

                const silhouetteDataSorted = Object.values(silhouetteDataGroupedByPartition).flat(1);
                const clusterMetricWholeContainer = d3.select("#partition-metric-silhouette-complete-graph-container").html("");
                addSilhouettePlot(clusterMetricWholeContainer, "Complete", silhouetteDataSorted, nodeColoursByPartition, "white");

            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr);
            console.log(ajaxOptions);
            console.log(thrownError);
            return Object.create(null);
        }
    });
}

const addSilhouettePlot = function (clusterMetricDiv, selectionId, data, barColour, titleColour) {
    const silhouetteID = `barplot-silhouette-${selectionId}`;
    clusterMetricDiv.append("div")
        .attr("id", silhouetteID)
        .style("position", "relative");
    barplot(silhouetteID, data, -1, 1, 300, 150, barColour, `barplot-silhouette-{selectionId}`, `\"${selectionId} Silhouette\"`, titleColour, 0);
}

//********Partition MCC barplots********
const createPartitionMccGraphs = function () {
    const classAttribute = document.getElementById("partition-metric-mcc-attribute-select").value;
    const mccObject = matthewsCorrelationCoeficient(classAttribute);
    const clusterMetricContainer = d3.select("#partition-metric-mcc-graph-container").html("");
    const clusterDivs = d3.selectAll("#list-selections div");
    if (clusterDivs.size() > 0) {
        clusterDivs
            .each(function (d) {
                const clusterMetricDiv = clusterMetricContainer.append("div");
                //addMccTable(clusterMetricDiv, d.id, mccObject);
                const titleColour = d3.select(this).style("background-color");
                addMccPlot(clusterMetricDiv, d.id, mccObject, titleColour);
            });

        const distinctClasses = currentGraph.getDistinctValues(classAttribute);
        const classColourList = d3.select("#class-colour-list").html("");
        for (const realClass of distinctClasses) {
            addListColour(realClass, groupColours(realClass), "class", classColourList);
        }
        changeClassColouringFromSettings('partition-metric-mcc-attribute-select', 'class-colour-list', false);
    }


}

const addMccTable = function (clusterMetricDiv, selectionId, mccObject) {
    const mccTableDiv = clusterMetricDiv
        .append("div")
        .attr("class", "col-2-table");

    for (const mccPair of mccObject[selectionId]) {
        const { className, value } = mccPair;
        mccTableDiv.append("span")
            .text(className + ": " + value.toFixed(2))
            .style("border", "0.1rem solid white")
    }
}

const addMccPlot = function (clusterMetricDiv, selectionId, mccObject, titleColour) {
    const barplotID = `barplot-mcc-${selectionId}`;
    clusterMetricDiv.append("div")
        .attr("id", barplotID)
        .style("position", "relative");
    barplot(barplotID, mccObject[selectionId], -1, 1, 300, 150, null,`barplot-mcc-${selectionId}`, `Cluster ${selectionId} MCC`, titleColour);
}

const matthewsCorrelationCoeficient = function (classAttributeName) {
    const distinctPartitions = currentGraph.getDistinctPartitions();
    const distinctClasses = currentGraph.getDistinctValues(classAttributeName);

    if (!distinctClasses || !distinctPartitions) {
        return null;
    }


    const confusionMatrices = {};
    for (const partition of distinctPartitions) {
        confusionMatrices[partition] = {};
        const partitionObject = confusionMatrices[partition];
        for (const className of distinctClasses) {
            partitionObject[className] = {
                TP: 0,
                FN: 0,
                TN: 0,
                FP: 0
            };
        }
    }

    for (const [node, nodePartition] of Object.entries(currentGraph.partitions)) {
        const nodeRealClass = currentGraph.getNodeDataValue(node, classAttributeName);

        for (const partition in confusionMatrices) {
            if (partition === nodePartition) {
                for (const className in confusionMatrices[partition]) {
                    if (className === nodeRealClass) {
                        confusionMatrices[partition][className].TP += 1;
                        continue;
                    }
                    confusionMatrices[partition][className].FP += 1;
                }
                continue;
            }

            for (const className in confusionMatrices[partition]) {
                if (className === nodeRealClass) {
                    confusionMatrices[partition][className].FN += 1;
                    continue;
                }
                confusionMatrices[partition][className].TN += 1;
            }

        }
    }

    const mccObject = {};
    for (const partition of distinctPartitions) {
        mccObject[partition] = [];
        const partitionArray = mccObject[partition];
        for (const className of distinctClasses) {
            const { TP, FP, FN, TN } = confusionMatrices[partition][className];

            const mccNumerator = (TN * TP) - (FN * FP);
            const mccDenominator = Math.sqrt((TP + FP) * (TP + FN) * (TN + FP) * (TN + FN));
            const mcc = mccNumerator / mccDenominator;
            partitionArray.push({ "x": className, "y": mcc });
        }
    }


    return mccObject;

}
//*******Partition attribute boxplots********

const generateAttributeAcrossPartitionsBoxplots = function () {
    const partitionMetricContainer = d3.select("#partition-metric-attribute-boxplot-graph-container").html("");
    const clusterDivs = d3.selectAll("#list-selections div");

    if (clusterDivs.size() > 0) {
        let activeAttributes = [];
        d3.selectAll("#remodel-active-attributes-select option").each(function (d) {
            activeAttributes.push(d3.select(this).property("value"));
        });

        for (const attribute of activeAttributes) {
            const partitionStats = d3.nest()
                .key(function (d) { return currentGraph.getPartition(d.id) })
                .rollup(function (d) {
                    q1 = d3.quantile(d.map(function (g) {
                        return currentGraph.getNodeDataValue(g.id, attribute);
                    }).sort(d3.ascending), .25);
                    median = d3.quantile(d.map(function (g) { return currentGraph.getNodeDataValue(g.id, attribute); }).sort(d3.ascending), .5);
                    q3 = d3.quantile(d.map(function (g) { return currentGraph.getNodeDataValue(g.id, attribute); }).sort(d3.ascending), .75);
                    IQRValue = q3 - q1;
                    min = d3.min(d.map(function (g) { return currentGraph.getNodeDataValue(g.id, attribute); }));
                    max = d3.max(d.map(function (g) { return currentGraph.getNodeDataValue(g.id, attribute); }));
                    return ({ q1: q1, median: median, q3: q3, "IQR": IQRValue, min: min, max: max });
                })
                .entries(currentGraph.nodes);

            partitionStats.sort(function (a, b) {
                return ('' + a.key).localeCompare(b.key);
            });
            boxplot(partitionMetricContainer, partitionStats, 600, 400, 'partition-metric-attribute-boxplot', attribute, `${attribute} boxplot`);
        }

        const colourObject = contructColourObjectFromList("partition-colour-list");
        updateBoxplotColour(partitionMetricContainer, colourObject);
    }
}

const generatePartitionAcrossAttributesBoxplots = function () {
    const partitionMetricContainer = d3.select("#partition-metric-partition-boxplot-graph-container").html("");
    const clusterDivs = d3.selectAll("#list-selections div");

    if (clusterDivs.size() > 0) {
        let activeAttributes = [];
        d3.selectAll("#remodel-active-attributes-select option").each(function (d) {
            activeAttributes.push(d3.select(this).property("value"));
        });
        clusterDivs.each(function (p) {
            const partition = p.id;
            const partitionNodes = currentGraph.nodes.filter(d => { return currentGraph.getPartition(d.id) === partition; });
            const partitionStats = d3.nest()
                .key(function (attr) { return attr; })
                .rollup(function (attr) {
                    q1 = d3.quantile(partitionNodes.map(function (g) {
                        return currentGraph.getNodeDataValue(g.id, attr);
                    }).sort(d3.ascending), .25);
                    median = d3.quantile(partitionNodes.map((g) => { return currentGraph.getNodeDataValue(g.id, attr); }).sort(d3.ascending), .5);
                    q3 = d3.quantile(partitionNodes.map((g) => { return currentGraph.getNodeDataValue(g.id, attr); }).sort(d3.ascending), .75);
                    IQRValue = q3 - q1;
                    min = d3.min(partitionNodes.map((g) => { return currentGraph.getNodeDataValue(g.id, attr); }));
                    max = d3.max(partitionNodes.map((g) => { return currentGraph.getNodeDataValue(g.id, attr); }));
                    return ({ q1: q1, median: median, q3: q3, "IQR": IQRValue, min: min, max: max });
                })
                .entries(activeAttributes);
            
            partitionStats.sort(function (a, b) {
                return ('' + a.key).localeCompare(b.key);
            });

            const colour = document.getElementById(`partition-colour-${partition}`).value;
            const boxplotSvg = boxplot(partitionMetricContainer, partitionStats, 600, 400,
                'partition-metric-partition-boxplot', partition, `Cluster ${partition} boxplot`, colour);
        });
    }


}

const changeBoxplotContainer = function (event) {
    $(".partition-boxplot-container").removeClass("active-grid")
    const boxplotGenerationType = {
        "attributes": function () {
            document.getElementById("partition-metric-partition-boxplot-graph-container").classList.add("active-grid");
        },
        "partitions": function () {
            document.getElementById("partition-metric-attribute-boxplot-graph-container").classList.add("active-grid");
        }
    }
    boxplotGenerationType[event.currentTarget.value]();
}

const invokeBoxplotGeneration = function () {
    const boxplotGenerationType = {
        "attributes": function () {
            generatePartitionAcrossAttributesBoxplots();
        },
        "partitions": function () {
            generateAttributeAcrossPartitionsBoxplots();
        }
    }
    const chosenBoxplotType = document.getElementById("partition-metric-boxplot-type-select").value;
    boxplotGenerationType[chosenBoxplotType]();
}
    
