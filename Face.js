class Face {
    outer_edge;
    inner_edges = [];

    global;

    constructor(outer_edge, inner_edges) {
        this.outer_edge = outer_edge;
        this.inner_edges = inner_edges;
    }


    /***
     *
     * @param {HalfEdge} outer_edge
     * @param {HalfEdge[]} inner_edges
     * @return {Face}
     */
    static addFace(outer_edge, inner_edges) {
        return new Face(outer_edge, inner_edges);
    }
}