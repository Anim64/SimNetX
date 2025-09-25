
class DataStore {
    constructor(data) {
        this._nodeData = data.nodes;
        this._linkData = data.links;
    }

    get nodeData() {
        return this._nodeData;
    }

    set nodeData(value) {
        this._nodeData = value;
    }

    get linkData() {
        return this._linkData;
    }

    getAllNodeData(id) {
        return this.nodeData[id];
    }

    getNodeDataValue(id, attribute) {
        return this._nodeData[id][attribute];
    }

    getLinkDataValue(id, attribute) {
        return this._linkData[id][attribute];
    }

    addNewNodeAttribute(id, attribute, value) {
        this._nodeData[id][attribute] = value;
    }

    removeNodeAttribute(id, attribute) {
        delete this._nodeData[id][attribute];
    }

    addNewLinkAttribute(id, attribute, value) {
        this._linkData[id][attribute] = value;
    }

    removeLinkAttribute(id, attribute) {
        delete this._linkData[id][attribute];
    }

    serialize() {
        const serializedData = {
            "nodeData": this._nodeData,
            "linkData": this._linkData
        };

        return serializedData;
    }

    deserialize(json) {
        this._nodeData = json.nodeData;
        this._linkData = json.linkData;
    }
}