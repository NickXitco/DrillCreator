class Vertex {
    x;
    y;

    edges = []; //Hedges originating from this vertex

    points = []; //Point objects linked to this vertex

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    isolated(){
        return (this.edges.length === 0);
    }

    addEdge(edge) {
        this.edges.push(edge);
        this.edges.sort(Vertex.angleSort);
    }

    closestCCW(edge) {
        let edgeIndex = this.edges.indexOf(edge);
        if (edgeIndex === 0) {
            return this.edges[this.edges.length - 1];
        }
        return this.edges[edgeIndex - 1];
    }

    static angleSort(a, b) {
        if (a.angle > b.angle) return 1;
        if (a.angle < b.angle) return -1;
        return 0;
    }

    /***
     *
     * @param {Number} x
     * @param {Number} y
     * @param {[HalfEdge]} hedges
     * @return {Vertex} newVertex
     */
    static addVertex(x, y, hedges) {
        let v = Vertex.vertexSearch(x, y, hedges);
        if (v !== null) {
            return v;
        }
        return new Vertex(x, y);
    }

    static vertexSearch(x, y, hedges) {
        for (const hedge of hedges) {
            if (hedge.origin.x === x && hedge.origin.y === y) {
                return hedge.origin;
            }
        }
        return null;
    }

    static getVertices(hedges) {
        let vertices = [];
        for (const hedge of hedges) {
            if (!vertices.includes(hedge.origin)) {
                vertices.push(hedge.origin);
            }
        }
        return vertices;
    }

    static misaligned(vertex) {
        let x = vertex.x;
        let y = vertex.y;
        for (const point of vertex.points) {
            if (point.x !== x || point.y !== y) {
                return true;
            }
        }
        return false;
    }

}