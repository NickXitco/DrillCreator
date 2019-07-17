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

    static removeEdge(hedge) {
        if (!(hedge.twin === hedge.next && hedge.twin === hedge.prev)) {
            hedge.next.prev = hedge.twin.prev;
            hedge.prev.next = hedge.twin.next;

            hedge.twin.next.prev = hedge.prev;
            hedge.twin.prev.next = hedge.next;
        }
    }


    /***
     *
     * @param {Vertex} from
     * @param {Vertex} to
     * @param {[HalfEdge]} hedges
     * @param {[Face]} faces
     * @param {Line} line
     * @returns {[Face]} all created faces
     */
    static addEdge(from, to, line, hedges, faces){

        //Check for coincidental edges
        let fromTo, toFrom;
        fromTo = new HalfEdge(from, null, null, null, null);
        toFrom = new HalfEdge(to, fromTo, null, fromTo, fromTo);
        fromTo.twin = toFrom;
        fromTo.next = toFrom;
        fromTo.prev = toFrom;

        fromTo.line = line;
        toFrom.line = line;

        line.anchorHedge = fromTo;
        line.endpointHedge = toFrom;

        fromTo.setAngle();
        toFrom.setAngle();

        hedges.push(fromTo);
        hedges.push(toFrom);

        this.linkHedges(from, fromTo, toFrom, to);

        let cycles = [];

        let globalCycle = new Cycle();
        globalCycle.globalCycle = true;

        this.buildCycles(hedges, cycles);

        let outsideCycles = cycles.filter(cycle => cycle.insideBoundary);
        let insideCycles = cycles.filter(cycle => !cycle.insideBoundary);

        this.cycleGraph(outsideCycles, cycles, globalCycle);

        return this.calculateFaces(insideCycles, globalCycle);
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

    static cycleGraph(outsideCycles, cycles, globalCycle) {
        for (const outsideCycle of outsideCycles) {
            let firstCycleHit;
            let firstCycleHitX = -1;
            for (const cycle of cycles) {
                const leftmost = outsideCycle.leftmostVertex;
                if (cycle !== outsideCycle && cycle.leftmostVertex.x < leftmost.x) {
                    let x = cycle.rightmostIntersection(leftmost.x, leftmost.y);
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
    }

    static buildCycles(hedges, cycles) {
        let hedges_to_check = [...hedges];
        while (hedges_to_check.length > 0) {
            let faceHedge = hedges_to_check.pop();
            let cycle = new Cycle(faceHedge.loop());
            hedges_to_check = hedges_to_check.filter(hedge => !cycle.hedges.includes(hedge));
            cycles.push(cycle);
        }
    }

    static calculateFaces(insideCycles, globalCycle) {
        let returnFaces = [];
        insideCycles.push(globalCycle);
        for (const cycle of insideCycles) {
            let innerComponents = [];
            //Run DFS on cycle's neighbors, add all items to innerComponents
            let Q = [...cycle.neighbors];
            while (Q.length > 0) {
                let c = Q.pop();
                innerComponents.push(c.hedges[0]);
                for (const neighbor of c.neighbors) {
                    if (neighbor !== cycle && !innerComponents.includes(neighbor.hedges[0])) {
                        Q.push(neighbor);
                    }
                }
            }

            let face;
            if (cycle === globalCycle) {
                face = Face.addFace(null, innerComponents);
                face.global = true;
            } else {
                face = Face.addFace(cycle.hedges[0], innerComponents);
                face.global = false;
            }
            face.setFaceRecordsOnEdges();
            returnFaces.push(face);
        }
        return returnFaces;
    }
}


