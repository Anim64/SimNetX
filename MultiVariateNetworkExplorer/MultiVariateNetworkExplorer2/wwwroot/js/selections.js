


const inputColorClick = function(selection_panel) {
    selection_panel.querySelector('input').click();
}

const stopClickPropagation = function(event) {
    event.stopPropagation();
}

const selectNodesBySelection = function(selectionId, graphRef) {
    deselectAllNodes();
    nodeGroups.filter(function (n) {
        return graphRef.getPartition(n.id) === selectionId;
    }).classed('selected', function (d) {
        d.previouslySelected = d.selected;
        return d.selected = true;
    });
}

const changeGroupColour = function(input, selectionId, graphRef) {
    const selectionPanel = input.parentNode;
    const newBackgroundColour = input.value;
    selectionPanel.style.backgroundColor = newBackgroundColour;
    const selectionNodes = node.filter(function (n) {
        return graphRef.getPartition(n.id) === selectionId;
    });

    selectionNodes.style("fill", function (d) {
        const nodeHeading = document.getElementById('heading-' + d.id);
        const lightness = fontLightness(newBackgroundColour);
        nodeHeading.style.color = 'hsl(0, 0%, ' + String(lightness) + '%)';
        nodeHeading.style.backgroundColor = ("backgroundColor", newBackgroundColour);
        
        
        link.filter(function (l) { return l.source === d.id || l.source.id === d.id })
            .style("stroke", newBackgroundColour);
        return newBackgroundColour;
    });

}

//Set color of nodes for certain selection
const setGroupColour = function (d) {
    document.getElementById("selection_color_" + d.id).value = groupColours(d.id);
}

//Get color of nodes in certain selection
const getGroupColour = function (d) {
    return document.getElementById("selection_color_" + d.id).value;
}

const addNewSelection = function () {
    const { length, [length - 1]: lastNode } = selectionGraph.nodes;
    const newId = length === 0 ? 0 : lastNode.id + 1;

    const newSelection = {};
    newSelection['id'] = newId;
    newSelection['name'] = 'Selection ' + newId;
    newSelection['nonodes'] = 0;

    selectionGraph.nodes.push(newSelection);

    for (const node of selectionGraph.nodes) {
        const newLink = {};
        newLink['source'] = newId;
        newLink['target'] = node.id;
        newLink['value'] = 0;

        const newLink2 = {};
        newLink2['source'] = node.id;
        newLink2['target'] = newId;
        newLink2['value'] = 0;

        selectionGraph.links.push(newLink);
        if (newId != node.id) {
            selectionGraph.links.push(newLink2);
        }
    }

    addSelectionDiv(newSelection)
    updateSelectionNodesAndLinks();
}

//Add new custom's group div
const addSelectionDiv = function(selection) {

    const newId = selection.id.toString();

    const mainDiv = d3.select('#list-selections');

    const panel = mainDiv
        .append('div')
        .classed('selection-panel', true)
        .attr('id', 'selection_panel_' + newId)
        .attr('onclick', 'selectNodesBySelection(\'' +(newId) + '\')');

    panel.append('h4')
        .attr('class', 'panel-title')
        .attr('contenteditable', 'true')
        .attr('onclick', 'stopClickPropagation(event)')
        .html("Selection " + newId);

    const input = panel.append('input')
        .attr('type', 'color')
        .attr('id', 'selection_color_' + newId)
        .attr('value', groupColours(newId))
        .attr('onchange', 'changeGroupColour(this,' + newId + ')');

    panel.style('background-color', input.attr('value'));

    const panel_list_add_btn = panel.append('button')
        .attr('class', 'btn btn-danger btn-sm rounded-0')
        .attr('type', 'button')
        .attr('data-toggle', 'tooltip')
        .attr('data-placement', 'top')
        .attr('title', 'Add Selected Nodes To This Group')
        .attr('onclick', 'addNodesToSelection(event,' + newId + ')');

    panel_list_add_btn.append('i')
        .attr('class', 'fa fa-plus-square');

    const panel_list_delete_btn = panel.append('button')
        .attr('class', 'btn btn-danger btn-sm rounded-0')
        .attr('type', 'button')
        .attr('data-toggle', 'tooltip')
        .attr('data-placement', 'top')
        .attr('title', 'Delete')
        .attr('onclick', 'deleteSelection(event,' + newId + ')');

    panel_list_delete_btn.append('i')
        .attr('class', 'fa fa-trash');

    

}

const hexToRgb = function (hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

const fontLightness = function (newColour) {
    const threshold = 0.5;
    let rgbRepresentation = newColour;
    if (typeof newColour !== 'object') {
        rgbRepresentation = hexToRgb(newColour);
    }
    const { r, g, b } = rgbRepresentation;

    const lumaRed = r * 0.2126;
    const lumaGreen = g * 0.7152;
    const lumaBlue = b * 0.0722;

    const lumaSum = lumaRed + lumaGreen + lumaBlue;
    const perceivedLightness = lumaSum / 255;

    const finalLightness = (perceivedLightness - threshold) * -10000000;

    return finalLightness;
}


//Move nodes to different selection
const addNodesToSelection = function (event, selectionId) {
    event.stopPropagation();
    const newColour = document.getElementById("selection_color_" + selectionId).value;
    const lightness = fontLightness(newColour);

    node.filter(function (d) { return d.selected })
        .each(function (d) {
            let previousGroup = null;
            const { id: nodeId } = d;
            const { [nodeId]: partition } = graph.partitions;

            if (partition != "") {
                previousGroup = partition;
                link.filter(function (l) { return l.source.id == nodeId || l.target.id == nodeId })
                    .each(function (l) {
                        const { source: { id: sourceId }, target: { id: targetId }, value } = l;
                        const { [sourceId]: node1Partition, [targetId]: node2Partition } = graph.partitions;

                        if (node1Partition != "" && node2Partition != "") {

                            if (sourceId == nodeId && node2Partition != "") {
                                //var previousSelectionLink = d3.select("#selection_link_" + previousGroup + "-" + node2Partition);
                                const newSelectionLink = selectionGraph.links.find(x => x.source.id == selectionId && x.target.id == node2Partition);
                                const previousSelectionLink = selectionGraph.links.find(x => x.source.id == previousGroup && x.target.id == node2Partition);
                                previousSelectionLink.value = previousSelectionLink.value - value;
                                newSelectionLink.value = previousSelectionLink.value + value;
                            }

                            else if (targetId == nodeId && node1Partition != "") {
                                const previousSelectionLink = selectionGraph.links.find(x => x.source.id == node1Partition && x.target.id == previousGroup);
                                const newSelectionLink = selectionGraph.links.find(x => x.source.id == node1Partition && x.target.id == selectionId);
                                previousSelectionLink.value = previousSelectionLink.value - value;
                                newSelectionLink.value = previousSelectionLink.value + value;
                            }
                        }
                    });

                const previousSelectionNode = selectionGraph.nodes.find(x => x.id == previousGroup);
                previousSelectionNode.nonodes = previousSelectionNode.nonodes - 1;

            }

            else {
                link.filter(function (l) { return l.source.id == nodeId || l.target.id == nodeId })
                    .each(function (l) {
                        const { source: { id: sourceId }, target: { id: targetId }, value } = l;
                        const { [sourceId]: node1Partition, [targetId]: node2Partition } = graph.partitions;

                        if (sourceId == nodeId && node2Partition != "") {
                            var newSelectionLink = selectionGraph.links.find(sl => sl.source.id == selectionId && sl.target.id == node2Partition);
                            newSelectionLink.value = newSelectionLink.value + value;
                        }

                        else if (targetId == nodeId && node1Partition != "") {
                            var newSelectionLink = selectionGraph.links.find(sl => sl.source.id == node1Partition && sl.target.id == selectionId);
                            newSelectionLink.value = newSelectionLink.value + value;
                        }

                    });



            }

            const newSelectionNode = selectionGraph.nodes.find(x => x.id == selectionId);
            newSelectionNode.nonodes = newSelectionNode.nonodes + 1;



            graph.partitions[d.id] = selectionId;


        })
        .style('fill', function (d) {
            const heading = document.getElementById('heading-' + d.id);

            heading.style.backgroundColor = newColour;
            heading.style.color = 'hsl(0, 0%, ' + String(lightness) + '%)';
            return newColour;
        })

    //updateSelectionNodesAndLinks();

    selectionNode.select("title")
        .text(function (d) {
            return "Number of Nodes: " + d.nonodes;
        })

    selectionLink.select("title")
        .text(function (d) {
            return d.value;
        })

}

//Deletes all selections
const deleteAllSelections = function (graphRef) {
    graphRef.clearPartitions();

    const { network: networkColour } = forceProperties.colouring;
    const lightness = fontLightness(networkColour);
    d3.selectAll('.node-heading')
        .style("background-color", networkColour)
        .style("color", 'hsl(0, 0%, ' + String(lightness) + '%)');


    selectionGraph.nodes = [];
    selectionGraph.links = [];

    updateSelectionNodesAndLinks();

    const selectionList = document.getElementById('list-selections');
    selectionList.innerHTML = "";

        updateNodeAndLinkColour(node, link);
    }
    


//Deletes one specific selection
const deleteSelection = function (event, selectionId) {
    event.stopPropagation();
    const selectionPanel = document.getElementById('selection_panel_' + selectionId);
    selectionPanel.parentNode.removeChild(selectionPanel);

    const lightness = fontLightness(forceProperties.colouring.network);
    const nodesFromDeletedPartition = node.filter(function (d) { return graph.partitions[d.id] == selectionId; })

    if (!forceProperties.attributeColouring.enabled) {
        nodesFromDeletedPartition.style("fill", function (d) {
            link.filter(function (l) { return l.source.id === d.id; })
                .style("stroke", forceProperties.colouring.network);

            d3.select('#heading-' + d.id)
                .style("background-color", forceProperties.colouring.network)
                .style("color", 'hsl(0, 0%, ' + String(lightness) + '%)');
            graph.partitions[d.id] = "";
            return forceProperties.colouring.network;
        });
    }

    else {
        nodesFromDeletedPartition.each(function (d) {
            d3.select('#heading-' + d.id)
                .style("background-color", forceProperties.colouring.network)
                .style("color", 'hsl(0, 0%, ' + String(lightness) + '%)');
            graph.partitions[d.id] = "";
            return forceProperties.colouring.network;
        });
    }


    selectionGraph.nodes = selectionGraph.nodes.filter(function (n) { return n.id != selectionId });
    selectionGraph.links = selectionGraph.links.filter(function (d) { return d.source.id != selectionId && d.target.id != selectionId });


    updateSelectionNodesAndLinks();
    //updateSelectionForces()

}

const stringifyCommunityDetectionLinkReplacer = function (key, value) {
    switch (key) {
        case "source":
        case "target": 
            { 
                return value.id;
            }
        default:
            {
                return value;
            }
    }
}

//Request for community detection on server
const requestCommunityDetection = function () {
    //const graph_string = JSON.stringify(graph);
    const nodes_string = JSON.stringify(currentGraph.nodes, ["id"]);
    const links_string = JSON.stringify(currentGraph.links, stringifyCommunityDetectionLinkReplacer);
    
    $.ajax({
        url: '/Home/GraphCommunityDetection',
        type: 'POST',
        //dataType: 'json',
        // It is important to set the content type
        // request header to application/json because
        // that's how the client will send the request
        //contentType: 'application/json',
        data: {
            nodes: nodes_string,
            links: links_string
        },
        //cache: false,
        success: function (result) {
            deleteAllSelections(currentGraph);

            const temp = JSON.parse(result.newPartitions);
            currentGraph.partitions = JSON.parse(result.newPartitions);
            //store.partitions = graph.partitions;
            selectionGraph = JSON.parse(result.newSelections);

            selectionGraph.nodes.forEach(function (d) {
                addSelectionDiv(d);
            });

            updateSelectionNodesAndLinks();

            if (!forceProperties.attributeColouring.enabled) {
                updateNodeAndLinkColour(node, link);
                return;
            }

            //updateHeadingColour(node);

            
            //updateSelectionForces();

        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(thrownError);
        }
    });
}
