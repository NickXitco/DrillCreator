class POI {
    id;
    x;
    y;
    endpoints = new Set();
    deleteFlag = false;


    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    removeLine(line) {
        this.endpoints.delete(line.anchor);
        this.endpoints.delete(line.endpoint);

        if (this.endpoints.size < 1) {
            this.destroy();
        }
    }

    destroy() {
        this.deleteFlag = true;
    }
}