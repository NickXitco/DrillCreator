class HalfEdge {
    vertex;

    twin;

    face;

    next;
    prev;

    constructor(vertex, twin, face, next, prev) {
        this.vertex = vertex;
        this.twin = twin;
        this.face = face;
        this.next = next;
    }
}