class POI {
    id;
    x;
    y;
    endpoints = new Set();
    deleteFlag = false;

    discovered = false; //For use in searches

    constructor(endpoint, id) {
        this.x = endpoint.x;
        this.y = endpoint.y;
        this.endpoints.add(endpoint);
        this.id = id;
    }

    move(x, y) {
        this.x = x;
        this.y = y;
    }

    removeEndpoint(endpoint) {
        return this.endpoints.delete(endpoint);
    }

    destroy() {
        this.deleteFlag = true;
    }
}