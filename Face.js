class Face {
    outer_edge;
    inner_edges = [];

    global;

    region;

    constructor(outer_edge, inner_edges, region) {
        this.outer_edge = outer_edge;
        this.inner_edges = inner_edges;
        this.region = region;
    }


    setFaceRecordsOnEdges() {
        if (this.outer_edge !== null) {
            let start = this.outer_edge;
            start.face = this;
            let current = start.next;
            while (current !== start) {
                current.face = this;
                current = current.next;

            }
        }
        if (this.inner_edges.length > 0) {
            for (const inner_edge of this.inner_edges) {
                let start = inner_edge;
                start.face = this;
                let current = start.next;
                while (current !== start) {
                    current.face = this;
                    current = current.next;
                }
            }
        }
    }


    /***
     *
     * @param {HalfEdge} outer_edge
     * @param {HalfEdge[]} inner_edges
     * @return {Face}
     */
    static addFace(outer_edge, inner_edges) {
        let r;
        if (outer_edge !== null) {
            r = new Region(outer_edge);
            r.render();
        }
        return new Face(outer_edge, inner_edges, r);
    }
}