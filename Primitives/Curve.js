class Curve extends Line {
    controlPoint;

    constructor (x, y, endpointX, endpointY, color) {
        super(x, y, endpointX, endpointY, color);
        this.centerY = y;
        this.centerX = x;
        this.controlPoint = new ControlPoint(x, y, this.self);
    }

    render() {
        super.render();
    }

    updateD() {
        if (this.controlPoint !== undefined) {
            this.d = "M" + this.x + " " + this.y + " Q" + this.controlPoint.x + " " + this.controlPoint.y + " " + this.endpointX + " " + this.endpointY;
            this.svg.setAttribute('d', this.d);
            this.expandedSVG.setAttribute('d', this.d);
            this.updateCenter();
        }
    }

    resetControlPoint() {
        this.controlPoint.setLocation((this.x + this.endpointX) / 2, (this.y + this.endpointY) / 2);
    }

    destroy() {
        super.destroy();
        this.controlPoint.destroy();
    }

    shift(dx, dy) {
        this.controlPoint.shift(dx, dy);
        super.shift(dx, dy);
    }

    updateCenter() {
        this.centerX = 0.25 * this.x + 0.5 * this.controlPoint.x + 0.25 * this.endpointX;
        this.centerY = 0.25 * this.y + 0.5 * this.controlPoint.y + 0.25 * this.endpointY;
    }

    highlightOn() {
        super.highlightOn();
        this.controlPoint.show();
    }

    highlightOff() {
        super.highlightOff();
        this.controlPoint.hide();
    }

    virtualSplit(t) {
        const x = Util.quadraticBezierFromT(this.anchor.x, this.controlPoint.x, this.endpoint.x, t);
        const y = Util.quadraticBezierFromT(this.anchor.y, this.controlPoint.y, this.endpoint.y, t);

        const cp1x = Util.linearBezierFromT(this.anchor.x, this.controlPoint.x, t);
        const cp1y = Util.linearBezierFromT(this.anchor.y, this.controlPoint.y, t);

        const cp2x = Util.linearBezierFromT(this.controlPoint.x, this.endpoint.x, t);
        const cp2y = Util.linearBezierFromT(this.controlPoint.y, this.endpoint.y, t);

        let curve1 = new Curve(this.anchor.x, this.anchor.y, x, y, "");
        curve1.highlightOff();
        curve1.updateD();
        curve1.controlPoint.setLocation(cp1x, cp1y);

        let curve2 = new Curve(x, y, this.endpoint.x, this.endpoint.y, "");
        curve2.highlightOff();
        curve2.updateD();
        curve2.controlPoint.setLocation(cp2x, cp2y);

        return {a: curve1, b: curve2};
    }

    split(t, hedges, lines) {
        const x = Math.round(Util.quadraticBezierFromT(this.anchor.x, this.controlPoint.x, this.endpoint.x, t));
        const y = Math.round(Util.quadraticBezierFromT(this.anchor.y, this.controlPoint.y, this.endpoint.y, t));

        const cp1x = Math.round(Util.linearBezierFromT(this.anchor.x, this.controlPoint.x, t));
        const cp1y = Math.round(Util.linearBezierFromT(this.anchor.y, this.controlPoint.y, t));

        const cp2x = Math.round(Util.linearBezierFromT(this.controlPoint.x, this.endpoint.x, t));
        const cp2y = Math.round(Util.linearBezierFromT(this.controlPoint.y, this.endpoint.y, t));

        if ((x === this.anchor.x && y === this.anchor.y) || (x === this.endpoint.x && y === this.endpoint.y)) {
            return {u: null, v: this, center: null};
        }

        HalfEdge.removeEdge(this.anchor.outgoingHedge, hedges);
        HalfEdge.removeEdge(this.endpoint.outgoingHedge, hedges);
        lines.splice(lines.indexOf(this), 1);
        this.destroy();

        let curve1 = new Curve(this.anchor.x, this.anchor.y, x, y, "#0000ff");
        let curve2 = new Curve(x, y, this.endpoint.x, this.endpoint.y, "#0000ff");

        curve1.controlPoint.setLocation(cp1x, cp1y);
        curve2.controlPoint.setLocation(cp2x, cp2y);

        curve1.render();
        curve1.highlightOff();
        curve2.render();
        curve2.highlightOff();

        curve1.setID(Util.emptySlot(lines));
        lines[curve1.id] = curve1;
        curve2.setID(Util.emptySlot(lines));
        lines[curve2.id] = curve2;

        let endVertex = Vertex.addVertex(this.endpoint.x, this.endpoint.y, hedges);
        let centerVertex = Vertex.addVertex(x, y, hedges);
        let beginningVertex = Vertex.addVertex(this.anchor.x, this.anchor.y, hedges);

        endVertex.points.splice(endVertex.points.indexOf(this.endpoint), 1);
        beginningVertex.points.splice(beginningVertex.points.indexOf(this.anchor), 1);

        //We don't want these to merge with other vertices, we only want them to be visible through the curve
        let cp1Vertex = Vertex.addControlPointVertex(cp1x, cp1y);
        let cp2Vertex = Vertex.addControlPointVertex(cp2x, cp2y);

        curve1.anchor.vertex = beginningVertex;
        curve1.endpoint.vertex = centerVertex;
        curve1.controlPoint.vertex = cp1Vertex;

        curve2.anchor.vertex = centerVertex;
        curve2.endpoint.vertex = endVertex;
        curve2.controlPoint.vertex = cp2Vertex;

        beginningVertex.points.push(curve1.anchor);
        cp1Vertex.points.push(curve1.controlPoint);
        centerVertex.points.push(curve1.endpoint);
        centerVertex.points.push(curve2.anchor);
        cp2Vertex.points.push(curve2.controlPoint);
        endVertex.points.push(curve2.endpoint);

        HalfEdge.addEdge(beginningVertex, cp1Vertex, curve1, hedges);
        HalfEdge.addEdge(cp1Vertex, centerVertex, curve1, hedges);
        HalfEdge.addEdge(centerVertex, cp2Vertex, curve2, hedges);
        HalfEdge.addEdge(cp2Vertex, endVertex, curve2, hedges);
        return {u: curve1, v: curve2, center: centerVertex};
    }
}