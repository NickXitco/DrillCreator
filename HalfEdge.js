class HalfEdge {
    vertex; //The Vertex which this half-edge emanates from

    twin; // The half-edge pair to this half-edge

    face; // The region/face this half-edge is incident to

    next; // The half-edge that this half-edge points to
    prev; // The half-edge that points to this half-edge (there is only 1!)

    angle;

    constructor(vertex, twin, face, next, prev) {
        this.vertex = vertex;
        this.twin = twin;
        this.face = face;
        this.next = next;
        this.prev = prev;
    }

    destination(){
        return this.twin.vertex;
    }

    setAngle(){
        const dx = this.destination().x - this.vertex.x;
        const dy = this.destination().y - this.vertex.y;

        const l = Math.sqrt(dx * dx + dy * dy);
        if (dy > 0) {
            this.angle = toDeg(Math.acos(dx / l));
        } else {
            this.angle = toDeg(Math.PI * 2 - Math.acos(dx / l));
        }

        function toDeg(rads) {
            return 180 * rads / Math.PI;
        }

    }

    isFree() {
        return (this.face == null || this.face.global);
    }


    /***
     *
     * @param {Vertex} from
     * @param {Vertex} to
     * @returns HalfEdge
     */
    static addEdge(from, to){
        if (from === to) {
            //Loop edge
            return null;
        }

        //Check for parallel edges? ie, if the edge already exists?

        let fromTo, toFrom;
        fromTo = new HalfEdge(from, null, null, null, null);
        toFrom = new HalfEdge(to, fromTo, null, fromTo, fromTo);
        fromTo.twin = toFrom;
        fromTo.next = toFrom;
        fromTo.prev = toFrom;

        fromTo.setAngle();
        toFrom.setAngle();

        let fromIsolated, toIsolated = false;

        if (from.isolated()) {
            fromIsolated = true;
            from.addEdge(fromTo);
        } else {
            from.addEdge(fromTo);

            let fromIn = from.closestCCW(fromTo).twin;
            let fromOut = fromIn.next;

            fromIn.next = fromTo;
            fromTo.prev = fromIn;

            toFrom.next = fromOut;
            fromOut.prev = toFrom;
        }

        if (to.isolated()) {
            toIsolated = true;
            to.addEdge(toFrom);
        } else {
            to.addEdge(toFrom);

            let toIn = to.closestCCW(toFrom).twin;
            let toOut = toIn.next;

            toIn.next = toFrom;
            toFrom.prev = toIn;

            fromTo.next = toOut;
            toOut.prev = fromTo;
        }

        if (fromIsolated && toIsolated) {
            //Disconnected, add dummy edge
        } else if (!fromIsolated && !toIsolated) {
           //Fully connected, check for new face
        }

        return fromTo;
    }

}


