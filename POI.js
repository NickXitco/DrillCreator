class POI {
    id;
    x;
    y;
    primitives = new Set();
    neighbors = new Set();

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    destroy() {
        delete this.primitives;
        delete this.neighbors;
    }
}