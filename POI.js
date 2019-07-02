class POI {
    id;
    x;
    y;
    primitives = new Set();
    neighbors = new Set();
    deleteFlag = false;


    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    removeLine(line) {
        let inc = this.primitives.delete(line);
        if (this.primitives.size < 2) {
            this.destroy();
        }
        return inc;
    }

    destroy() {
        for (const neighbor of this.neighbors) {
            neighbor.neighbors.delete(this);
        }
        this.deleteFlag = true;
    }
}