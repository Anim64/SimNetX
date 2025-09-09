
class Graph {
    static forceNames = {
        link: "link",
        charge: "charge",
        collide: "collide",
        center: "center",
        forceX: "forceX",
        forceY: "forceY"
    }

    constructor(input_graph, simMat, dataStore, view_width, view_height) {
        
        this._data = dataStore;
        this._nodes = input_graph.nodes;
        this._properties = {};
        this._attributes = input_graph.attributes;
        this._classes = input_graph.classes;
        this._metric = input_graph.metric;
        this._conversionAlg = input_graph.conversionAlg;
        this._similarityMatrix = simMat;
        

        this._links = input_graph.links;
        this._linkedByIndex = [];
        for (const l of this.links) {
            const { source, target } = l;
            const index = source + "," + target;
            this._linkedByIndex[index] = 1;
        }
        this._partitions = input_graph.partitions;

        this.updateLinkIndeces();

        const { link, charge, collide, center, forceX, forceY } = Graph.forceNames;
        this._simulation = d3.forceSimulation()
            .force(link, d3.forceLink())
            .force(charge, d3.forceManyBody())
            .force(collide, d3.forceCollide())
            .force(center, d3.forceCenter())
            .force(forceX, d3.forceX())
            .force(forceY, d3.forceY())
            .nodes(this.nodes);

        
        this._forces = {
            center: {
                x: 0.5,
                y: 0.5,
                width: view_width,
                height: view_height,
                strength: 2
            },

            charge: {
                enabled: true,
                strength: -80,
                distanceMin: 1,
                distanceMax: 2000
            },

            collide: {
                enabled: true,
                strength: 0.7,
                previousRadius: 8,
                radius: 8,
                iterations: 1
            },

            forceX: {
                enabled: true,
                strength: 0.1,
                x: 0.5,
                attribute: ""
            },

            forceY: {
                enabled: true,
                strength: 0.1,
                y: 0.5,
                attribute: ""
            },

            link: {
                enabled: true,
                distance: 75,
                iterations: 1
            }
        };

        this.toggleXForce(true);
        this.toggleYForce(true);
    }

    get graph() {
        const graphObject = {
            "nodes": this._nodes,
            "links": this._links,
            "linkedByIndex": this._linkedByIndex
        };
        return graphObject;
    }

    get nodes() {
        return this._nodes;
    }

    get nodeCount() {
        return this._nodes.length;
    }

    get links() {
        return this._links;
    }

    set links(value) {
        this._links = value;
    }

    get linkCount() {
        return this._links.length;
    }

    get attributes() {
        return this._attributes;
    }

    get similarityMatrix() {
        return this._similarityMatrix;
    }

    get simulation() {
        return this._simulation;
    }

    get forces() {
        return this._forces;
    }

    get partitions() {
        return this._partitions;
    }

    set partitions(value) {
        this._partitions = value;
    }

    get classes() {
        return this._classes;
    }

    get metric() {
        return this._metric;
    }

    get properties() {
        return this._properties;
    }

    set metric(value) {
        this._metric = value;
    }

    set simialrityMatrix(value) {
        this._similarityMatrix = value;
    }

    get conversionAlg() {
        return this._conversionAlg;
    }

    set conversionAlg(value) {
        this._conversionAlg = value;
    }

    setProperties(name, value) {
        this._properties[name] = value;
    }

    isConnected(nodeId1, nodeId2) {
        return this._linkedByIndex[nodeId1 + "," + nodeId2] || this._linkedByIndex[nodeId2 + "," + nodeId1] || nodeId1 === nodeId2;
    }

    addNode(id) {
        const newNode = { "id": id };
        this.nodes.push(newNode);
    }

    addLink(sourceId, targetId, value) {
        const newLink = {};
    }

    getNodeDataValue(id, attribute) {
        return this._data.getNodeDataValue(id, attribute);
    }

    getPropertyValue(id, attribute) {
        const propertyValues = this._properties[attribute];
        return propertyValues !== undefined ? propertyValues.values[id] : undefined;
    }

    getAllAttributeValues(attribute) {
        const valueList = [];
        for (const node of this._nodes) {
            valueList.push(this.getNodeDataValue(node.id, attribute));
        }

        return valueList;
    }

    getPropertyAttributeValue(property, attribute) {
        return this._properties[property][attribute];
    }

    getLinkDataValue(id, attribute) {
        return this._data.getLinkDataValue(id, attribute);
    }

    getDistinctValues(attribute) {
        const distinctList = [];
        if (!this._attributes["cat"].includes(attribute)) {
            return distinctList;
        }

        for (const node of this.nodes) {
            const value = this.getNodeDataValue(node.id, attribute);
            if (!distinctList.includes(value)) {
                distinctList.push(value);
            }
        }

        return distinctList;
    }

    getDistinctPartitions() {
        const distinctList = [];

        for (const [node, partition] of Object.entries(this.partitions)) {
            if (partition === "") {
                continue;
            }

            if (!distinctList.includes(partition)) {
                distinctList.push(partition);
            }
        }

        return distinctList;
    }

    getDistinctClasses() {
        const distinctList = [];

        for (const [node, partition] of Object.entries(this.classes)) {
            if (!distinctList.includes(partition)) {
                distinctList.push(partition);
            }
        }

        return distinctList;
    }

    getPartition(id) {
        return this._partitions[id];
    }

    setPartition(id, value) {
        this._partitions[id] = value;
    }

    clearPartitions() {
        for (const node in this._partitions) {
            this.setPartition(node, "");
        }
    }

    getClass(id) {
        return this._classes[id];
    }

    

    getForce(force) {
        return this._forces[force];
    }

    getForcePropertyValue(force, property)
    {
        return this._forces[force][property];
    }

    setForcePropertyValue(force, property, value) {
        this._forces[force][property] = value;
    }

    setPreviousRadius() {
        const { radius } = this._forces.collide.radius;
        this._forces.collide.previousRadius = radius;
    }

    updateLinkIndeces() {
        this._linkedByIndex = [];
        for (const l of this.links) {
            const { source, target } = l;
            const index = source + "," + target;
            this._linkedByIndex[index] = 1;
        }
    }

    serialize() {
        const serializedGraph = {
            "nodes": this._nodes,
            "links": structuredClone(this._links),
            "properties": this._properties,
            "partitions": this._partitions,
            "classes": this._classes,
            "attributes": this._attributes,
            "metric": this._metric,
            "conversionAlg": this._conversionAlg,
            "linkedByIndex": this._linkedByIndex,
            "forces": this._forces
        };

        for (const link of serializedGraph.links) {
            link.source = link.source.id;
            link.target = link.target.id;
        }

        return serializedGraph;
    }

    deserialize(json) {
        this._nodes = json.nodes;
        this._properties = json.properties;
        this._attributes = json.attributes;
        this._classes = json.classes;
        this._metric = json.metric;
        this._conversionAlg = json.conversionAlg;
        this._links = json.links;
        this._linkedByIndex = json.linkedByIndex;
        this._partitions = json.partitions;
        this._forces = json.forces;
    }

    max(attributeName) {
        return d3.max(Object.values(this._data.nodeData), function (d) {
            return d[attributeName];
        });
    }

    min(attributeName) {
        return d3.min(Object.values(this._data.nodeData), d => d[attributeName]);
    }

    updateForces(reset = true) {
        this.updateCenterForce();
        this.updateChargeForce();
        this.updateCollideForce();
        this.updateLinkForce();

        if (reset) {
            this.resetSimulation();
        }
    }

    updateSimulationEnd(method) {
        this._simulation.on("end", method);
    }

    updateSimulationTick(method) {
        this._simulation.on("tick", method);
    }

    updateCenterForce() {
        const { x, y, width, height, strength } = this._forces.center;
        this._simulation.force(Graph.forceNames.center)
            .x(width * x)
            .y(height * y);
    }

    updateChargeForce() {
        const { strength: chargeStrength, enabled: chargeEnabled, distanceMin, distanceMax } = this._forces.charge;
        this._simulation.force(Graph.forceNames.charge)
            .strength(chargeStrength * chargeEnabled)
            .distanceMin(distanceMin)
            .distanceMax(distanceMax);
    }

    updateCollideForce() {
        const { strength: collideStrength, enabled: collideEnabled, radius, iterations: collideIterations } = this._forces.collide;
        this._simulation.force(Graph.forceNames.collide)
            .strength(collideStrength * collideEnabled)
            .radius(radius)
            .iterations(collideIterations);
    }

    updateLinkForce() {
        const { enabled: linksEnabled, distance, iterations: linkIterations } = this._forces.link;
        const chosenLinks = linksEnabled ? this._links : [];
        const partitions = this._partitions;
        this._simulation.force(Graph.forceNames.link)
            .id(function (d) { return d.id; })
            .distance(function (l) {
                if (partitions[l.source.id] === partitions[l.target.id]) {
                    return distance;
                }
                else {
                    return distance * 4;
                }
            })
            .iterations(linkIterations)
            .links(chosenLinks);
    }

    toggleXForce(enabled) {
        const { forceX: forceXName } = Graph.forceNames;
        this._forces[forceXName].enabled = enabled;
        const { strength } = this.getForce(forceXName);
        this._simulation.force(forceXName)
            .strength(strength * enabled);
    }

    setDefaultXForce() {
        const { forceX: forceXName } = Graph.forceNames;
        const { x } = this.getForce(forceXName);
        this._simulation.force(forceXName)
            .x(x);
    }

    updateXForceAttribute(attributeName, attributeMax, attributeMin){
        const { forceX: forceXName, center } = Graph.forceNames;
        const width = this.getForcePropertyValue(center, "width");
        this.setForcePropertyValue(forceXName, "attribute", attributeName);
        const g = this;
        this._simulation.force(forceXName)
            .x(function (d) {
                const attributeValue = g.getNodeDataValue(d.id, attributeName);
                if (attributeValue == "") {
                    return width / 2;
                }
                const resultXCoord = width * ((parseFloat(attributeValue) - attributeMin) / (attributeMax - attributeMin)) + 1;
                return resultXCoord;
            });
    }

    updateXForceProperty(attributeName) {
        const { forceX: forceXName, center } = Graph.forceNames;
        const width = this.getForcePropertyValue(center, "width");
        this.setForcePropertyValue(forceXName, "attribute", attributeName);
        const attributeMin = this.getPropertyAttributeValue(attributeName, "min");
        const attributeMax = this.getPropertyAttributeValue(attributeName, "max");
        const g = this;
        this._simulation.force(forceXName)
            .x(function (d) {
                const attributeValue = g.getPropertyValue(d.id, attributeName);
                if (attributeValue == "") {
                    return width / 2;
                }

                const resultXCoord = width * ((parseFloat(attributeValue) - attributeMin) / (attributeMax - attributeMin));
                return resultXCoord;
            });
    }

    toggleYForce(enabled) {
        const { forceY: forceYName } = Graph.forceNames;
        this._forces[forceYName].enabled = enabled;
        const { strength } = this.getForce(forceYName);
        this._simulation.force(forceYName)
            .strength(strength * enabled);
    }

    updateYForceAttribute(attributeName, attributeMax, attributeMin) {
        const { forceY: forceYName, center } = Graph.forceNames;
        const height = this.getForcePropertyValue(center, "width");
        this.setForcePropertyValue(forceYName, "attribute", attributeName);
        const g = this;
        this._simulation.force(forceYName)
            .y(function (d) {
                const attributeValue = g.getNodeDataValue(d.id, attributeName);
                if (attributeValue == "") {
                    return height / 2;
                }

                const resultYCoord = height - (height * ((parseFloat(attributeValue) - attributeMin) / (attributeMax - attributeMin)));
                return resultYCoord;
            });
    }

    updateYForceProperty(attributeName) {
        const { forceY: forceYName, center } = Graph.forceNames;
        const height = this.getForcePropertyValue(center, "width");
        this.setForcePropertyValue(forceYName, "attribute", attributeName);
        const attributeMin = this.getPropertyAttributeValue(attributeName, "min");
        const attributeMax = this.getPropertyAttributeValue(attributeName, "max");
        const g = this;
        this._simulation.force(forceYName)
            .y(function (d) {
                const attributeValue = g.getPropertyValue(d.id, attributeName);
                if (attributeValue == "") {
                    return height / 2;
                }

                const resultYCoord = height - (height * ((parseFloat(attributeValue) - attributeMin) / (attributeMax - attributeMin)));
                return resultYCoord;
            });
    }

    updateSimulationNodes() {
        this._simulation.nodes(this._nodes);
    }

    resetSimulation() {

        this._simulation.alpha(1).restart();
    }

    stopSimulation() {
        this._simulation.stop();
    }
}
