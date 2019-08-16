class HalfEdge {
    origin; //The Vertex which this half-edge emanates from

    twin; // The half-edge pair to this half-edge

    face; // The region/face this half-edge is incident to

    next; // The half-edge that this half-edge points to
    prev; // The half-edge that points to this half-edge (there is only 1!)

    angle; //The number of degrees this hedge is CW from the vector (0, 0) -> (inf, 0)

    line; //The line object this hedge corresponds to.

    constructor(vertex, twin, face, next, prev) {
        this.origin = vertex;
        this.twin = twin;
        this.face = face;
        this.next = next;
        this.prev = prev;
    }

    destination(){
        return this.twin.origin;
    }

    setAngle(){
        this.angle = HalfEdge.getAngle(this.origin.x, this.origin.y,
                                       this.destination().x, this.destination().y);
    }

    loop() {
        let loop = [this];
        let node = this.next;
        while (node !== this) {
            loop.push(node);
            node = node.next;
        }
        return loop;
    }

    isCurve() {
        return this.line instanceof Curve;
    }

    /**
     * Finds the y coordinate of the point where the hedge intersects the given x (or null if no such point exists)
     * @param x The x value to check
     * @return {null|number}
     */
    yIntersect(x) {
        let x1 = this.origin.x;
        let x2 = this.destination().x;
        if (Math.abs(x1 - x) + Math.abs(x - x2) === Math.abs(x1 - x2)) {
            let m = HalfEdge.getSlope(this.origin.x, this.origin.y, this.destination().x, this.destination().y);
            let b = this.origin.y - m * this.origin.x;
            return m*x+b;
        }
        return null;
    }

    static getSlope(x1, y1, x2, y2) {
        if (x1 === x2) {
            return Infinity;
        }
        return (y2 - y1) / (x2 - x1);
    }


    static getAngle(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;

        const l = Math.sqrt(dx * dx + dy * dy);
        if (dy > 0) {
            return toDeg(Math.acos(dx / l));
        } else {
            return toDeg(Math.PI * 2 - Math.acos(dx / l));
        }

        function toDeg(rads) {
            return 180 * rads / Math.PI;
        }
    }

    static removeEdge(hedge, hedges) {
        hedges.splice(hedges.indexOf(hedge), 1);
        hedges.splice(hedges.indexOf(hedge.twin), 1);
        hedge.origin.edges.splice(hedge.origin.edges.indexOf(hedge), 1);
        hedge.destination().edges.splice(hedge.destination().edges.indexOf(hedge.twin), 1);

        if (!(hedge.twin === hedge.next && hedge.twin === hedge.prev)) {
            hedge.next.prev = hedge.twin.prev;
            hedge.prev.next = hedge.twin.next;

            hedge.twin.next.prev = hedge.prev;
            hedge.twin.prev.next = hedge.next;
        }
        return hedge;
    }


    /***
     *
     * @param {Vertex} from
     * @param {Vertex} to
     * @param {[HalfEdge]} hedges
     * @param {Line} line
     */
    static addEdge(from, to, line, hedges){
        //Check for coincidental edges
        let fromTo, toFrom;
        fromTo = new HalfEdge(from, null, null, null, null);
        toFrom = new HalfEdge(to, fromTo, null, fromTo, fromTo);
        fromTo.twin = toFrom;
        fromTo.next = toFrom;
        fromTo.prev = toFrom;

        fromTo.line = line;
        toFrom.line = line;

        let fromPoint, toPoint;

        for (const point of from.points) {
            if (point.parentLine === line) {
                fromPoint = point;
            }
        }

        for (const point of to.points) {
            if (point.parentLine === line) {
                toPoint = point;
            }
        }

        fromPoint.outgoingHedge = fromTo;
        fromPoint.incomingHedge = toFrom;
        toPoint.incomingHedge = fromTo;
        toPoint.outgoingHedge = toFrom;

        fromTo.setAngle();
        toFrom.setAngle();

        hedges.push(fromTo);
        hedges.push(toFrom);

        this.linkHedges(from, fromTo, toFrom, to);
    }

    static linkHedges(from, fromTo, toFrom, to) {
        if (from.isolated()) {
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

}


