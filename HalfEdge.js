class HalfEdge {
    origin; //The Vertex which this half-edge emanates from

    twin; // The half-edge pair to this half-edge

    face; // The region/face this half-edge is incident to

    next; // The half-edge that this half-edge points to
    prev; // The half-edge that points to this half-edge (there is only 1!)

    angle;

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
        const dx = this.destination().x - this.origin.x;
        const dy = this.destination().y - this.origin.y;

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

    degenerate() {
        return this.next === this.twin || this.prev === this.twin;
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



    /***
     *
     * @param {Vertex} from
     * @param {Vertex} to
     * @param {[HalfEdge]} hedges
     * @returns {toFrom: HalfEdge, fromTo: HalfEdge} HalfEdge
     */
    static addEdge(from, to, hedges){
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

        hedges.push(fromTo);
        hedges.push(toFrom);

        let cycles = [];

        let globalCycle = new Cycle();
        globalCycle.globalCycle = true;

        if (fromIsolated && toIsolated) {
            //TODO Disconnected, add dummy edge (we may not need to do this. in fact, I'm almost sure we don't.)
        } else {
            let hedges_to_check = [...hedges];
            while (hedges_to_check.length > 0) {
                let faceHedge = hedges_to_check.pop();
                let cycle = new Cycle(faceHedge.loop());
                hedges_to_check = hedges_to_check.filter(hedge => !cycle.hedges.includes(hedge));
                cycles.push(cycle);
            }
        }

        let outsideCycles = cycles.filter(cycle => cycle.insideBoundary);
        let insideCycles = cycles.filter(cycle => !cycle.insideBoundary);

        for (const outsideCycle of outsideCycles) {
            let firstCycleHit;
            let firstCycleHitX = -1;
            for (const cycle of cycles) {
                if (cycle !== outsideCycle && cycle.leftmostVertex.x < outsideCycle.leftmostVertex.x) {
                    let x = cycle.rightmostIntersection(outsideCycle.leftmostVertex.y);
                    if (x > firstCycleHitX) {
                        firstCycleHit = cycle;
                        firstCycleHitX = x;
                    }
                }
            }
            if (firstCycleHit === undefined) {
                outsideCycle.globalCycle = true;
                globalCycle.neighbors.push(outsideCycle);
                outsideCycle.neighbors.push(globalCycle);
            } else {
                outsideCycle.neighbors.push(firstCycleHit);
                firstCycleHit.neighbors.push(outsideCycle);
            }
        }

        console.table(cycles);

        for (const cycle of insideCycles) {
            let innerComponents = [];
            //Run DFS on cycle's neighbors, add all items to innerComponents
            let face = Face.addFace(cycle.leftmostVertex.origin, innerComponents);
        }
        return {fromTo, toFrom};
    }

}


