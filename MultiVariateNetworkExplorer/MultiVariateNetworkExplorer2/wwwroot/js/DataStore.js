
class DataStore {
    constructor(data) {
        this._nodeData = data.nodes;
        this._linkData = data.links;

        this._linkStore = [];
    }

    get getNodeData() {
        return this._nodeData;
    }

    set nodeData(value) {
        this._nodeData = value;
    }

    get getLinkData() {
        return this._linkData;
    }

    addToLinkStore(link) {
        this._linkStore.push(link);
    }

    removeFromLinkStore(sourceId, targetId) {
        /*this._linkStore.splice();*/
    }

    getNodeDataValue(id, attribute) {
        return this._nodeData[id][attribute];
    }

    getLinkDataValue(id, attribute) {
        return this._linkData[id][attribute];
    }
}