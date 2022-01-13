function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


function inputColorClick(selection_panel) {
    selection_panel.querySelector('input').click();
}

function stopClickPropagation(event) {
    event.stopPropagation();
}


function changeGroupColour(input, selectionId) {
    const selectionPanel = input.parentNode
    let newBackgroundColour = input.value;
    selectionPanel.style.backgroundColor = newBackgroundColour;
    
    //selectionPanel.style.setProperty(--light)
    var selectionNodes = node.filter(function (n) {
        return graph.partitions[n.id] === selectionId;
    })
    selectionNodes.style("fill", function (d) {
        $('#heading-' + d.id).style.backgroundColor = newBackgroundColour;
        link.filter(function (l) { return l.source === d.id || l.source.id === d.id })
            .style("stroke", newBackgroundColour);
            return input.value;
        });

}

//Set color of nodes for certain selection
function setGroupColour(d) {
    document.getElementById("selection_color_" + d.id).value = groupColours(d.id);
}

//Get color of nodes in certain selection
function getGroupColour(d) {
    return document.getElementById("selection_color_" + d.id).value;
}

function addNewSelection() {
    var newId = selectionGraph.nodes.length === 0 ? 0 : parseInt(selectionGraph.nodes[selectionGraph.nodes.length - 1].id) + 1;

    var newSelection = {};
    newSelection['id'] = newId;
    newSelection['name'] = 'Selection ' + newId;
    newSelection['nonodes'] = 0;

    selectionGraph.nodes.push(newSelection);

    selectionGraph.nodes.forEach(function (d) {
        var newLink = {};
        newLink['source'] = newId;
        newLink['target'] = d.id;
        newLink['value'] = 0;

        var newLink2 = {};
        newLink2['source'] = d.id;
        newLink2['target'] = newId;
        newLink2['value'] = 0;

        selectionGraph.links.push(newLink);
        if (newId != d.id) {
            selectionGraph.links.push(newLink2);
        }


    });

    addSelectionDiv(newSelection)
    updateSelectionNodesAndLinks();
}

//Add new custom's group div
function addSelectionDiv(selection) {

    var newId = selection.id;
    newId = newId.toString();

    var mainDiv = d3.select('#list-selections');

    var panel = mainDiv
        .append('div')
        .classed('selection-panel', true)
        .attr('id', 'selection_panel_' + newId)
        .attr('onclick', 'inputColorClick(this)');

    panel.append('h4')
        .attr('class', 'panel-title')
        .attr('contenteditable', 'true')
        .attr('onclick', 'stopClickPropagation(event)')
        .html("Selection " + newId);

    var input = panel.append('input')
        .attr('type', 'color')
        .attr('id', 'selection_color_' + newId)
        .attr('value', groupColours(newId))
        .attr('onchange', 'changeGroupColour(this,' + newId + ')');

    panel.style('background-color', input.attr('value'));

    var panel_list_add_btn = panel.append('button')
        .attr('class', 'btn btn-danger btn-sm rounded-0')
        .attr('type', 'button')
        .attr('data-toggle', 'tooltip')
        .attr('data-placement', 'top')
        .attr('title', 'Add Selected Nodes To This Group')
        .attr('onclick', 'addNodesToSelection(event,' + newId + ')');

    panel_list_add_btn.append('i')
        .attr('class', 'fa fa-plus-square');

    var panel_list_delete_btn = panel.append('button')
        .attr('class', 'btn btn-danger btn-sm rounded-0')
        .attr('type', 'button')
        .attr('data-toggle', 'tooltip')
        .attr('data-placement', 'top')
        .attr('title', 'Delete')
        .attr('onclick', 'deleteSelection(event,' + newId + ')');

    panel_list_delete_btn.append('i')
        .attr('class', 'fa fa-trash');

    

}


//Move nodes to different selection
function addNodesToSelection(event, selectionId) {
    event.stopPropagation();
    var newColour = document.getElementById("selection_color_" + selectionId).value;
    const threshold = 0.5;
    var rgbRepresentation = hexToRgb(newColour);
    var red = rgbRepresentation['r'];
    var green = rgbRepresentation['g'];
    var blue = rgbRepresentation['b'];

    var lumaRed = red * 0.2126;
    var lumaGreen = green * 0.7152;
    var lumaBlue = blue * 0.0722;

    var lumaSum = lumaRed + lumaGreen + lumaBlue;
    var perceivedLightness = lumaSum / 255;

    var finalLightness = (perceivedLightness - threshold) * -10000000;

    node.filter(function (d) { return d.selected })
        .each(function (d) {
            var previousGroup;
            if (graph.partitions[d.id] != "") {
                previousGroup = graph.partitions[d.id];
                link.filter(function (l) { return l.source.id == d.id || l.target.id == d.id })
                    .each(function (l) {
                        if (graph.partitions[l.source.id] != "" && graph.partitions[l.target.id] != "") {
                            var value = l.value;

                            if (l.source.id == d.id && graph.partitions[l.target.id] != "") {
                                //var previousSelectionLink = d3.select("#selection_link_" + previousGroup + "-" + graph.partitions[l.target.id]);
                                var newSelectionLink = selectionGraph.links.find(x => x.source.id == selectionId && x.target.id == graph.partitions[l.target.id]);
                                var previousSelectionLink = selectionGraph.links.find(x => x.source.id == previousGroup && x.target.id == graph.partitions[l.target.id]);
                                previousSelectionLink.value = previousSelectionLink.value - value;
                                newSelectionLink.value = previousSelectionLink.value + value;
                            }

                            else if (l.target.id == d.id && graph.partitions[l.source.id] != "") {
                                var previousSelectionLink = selectionGraph.links.find(x => x.source.id == graph.partitions[l.source.id] && x.target.id == previousGroup);
                                var newSelectionLink = selectionGraph.links.find(x => x.source.id == graph.partitions[l.source.id] && x.target.id == selectionId);
                                previousSelectionLink.value = previousSelectionLink.value - value;
                                newSelectionLink.value = previousSelectionLink.value + value;
                            }
                        }
                    });

                var previousSelectionNode = selectionGraph.nodes.find(x => x.id == previousGroup);
                previousSelectionNode.nonodes = previousSelectionNode.nonodes - 1;

            }

            else {
                link.filter(function (l) { return l.source.id == d.id || l.target.id == d.id })
                    .each(function (l) {
                        var value = l.value;

                        if (l.source.id == d.id && graph.partitions[l.target.id] != "") {
                            var newSelectionLink = selectionGraph.links.find(sl => sl.source.id == selectionId && sl.target.id == graph.partitions[l.target.id]);
                            newSelectionLink.value = newSelectionLink.value + value;
                        }

                        else if (l.target.id == d.id && graph.partitions[l.source.id] != "") {
                            var newSelectionLink = selectionGraph.links.find(sl => sl.source.id == graph.partitions[l.source.id] && sl.target.id == selectionId);
                            newSelectionLink.value = newSelectionLink.value + value;
                        }

                    });



            }

            var newSelectionNode = selectionGraph.nodes.find(x => x.id == selectionId);
            newSelectionNode.nonodes = newSelectionNode.nonodes + 1;



            graph.partitions[d.id] = selectionId;


        })
        .style('fill', function (d) {
            let heading = document.querySelector('#heading-' + d.id);

            heading.style.backgroundColor = newColour;
            heading.style.color = 'hsl(0, 0%, ' + String(finalLightness) + '%)';
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
function deleteAllSelections() {
    /*selectionNode.each(function (d) {
        var selectionPanel = document.querySelector('#selection_panel_' + d.id);
        selectionPanel.parentNode.removeChild(selectionPanel);

        
    })*/

    node.style("fill", defaultColour);

    selectionGraph.nodes = [];
    selectionGraph.links = [];

    updateSelectionNodesAndLinks();

    var selectionList = document.querySelector('#list-selections');
    selectionList.innerHTML = "";

}

//Deletes one specific selection
function deleteSelection(event, selectionId) {
    event.stopPropagation();
    var selectionPanel = document.querySelector('#selection_panel_' + selectionId);
    selectionPanel.parentNode.removeChild(selectionPanel);

    node.filter(function (d) { return graph.partitions[d.id] == selectionId; })
        .style("fill", defaultColour)
        .each(function (n) {
            graph.partitions[n.id] = "";
        })


    selectionGraph.nodes = selectionGraph.nodes.filter(function (n) { return n.id != selectionId });
    selectionGraph.links = selectionGraph.links.filter(function (d) { return d.source.id != selectionId && d.target.id != selectionId });


    updateSelectionNodesAndLinks();
    //updateSelectionForces()

}

//Request for community detection on server
function requestCommunityDetection() {
    store.nodes.forEach(function (d) {
        graph.partitions[d.id] = "";
    });

    var graph_string = JSON.stringify(graph);


    $.ajax({
        url: 'GraphCommunityDetection',
        type: 'POST',
        dataType: 'json',
        // It is important to set the content type
        // request header to application/json because
        // that's how the client will send the request
        //contentType: 'application/json',
        data: { graphFilt: graph_string },
        //cache: false,
        success: function (result) {
            deleteAllSelections();

            graph.partitions = JSON.parse(result.newPartitions);
            selectionGraph = JSON.parse(result.newSelections);

            selectionGraph.nodes.forEach(function (d) {
                addSelectionDiv(d);
            });

            updateNodesAndLinks();
            updateSelectionNodesAndLinks();
            //updateSelectionForces();

        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(thrownError);
        }
    });
}