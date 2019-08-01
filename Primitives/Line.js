class Line extends Canvas_Primitive {
    endpointX;
    endpointY;

    centerX;
    centerY;

    anchor;
    endpoint;

    anchorHedge;
    endpointHedge;

    constructor (x, y, endpointX, endpointY, color) {
        super(x, y, color);
        this.endpointX = endpointX;
        this.endpointY = endpointY;
        this.svg.setAttribute('stroke-width', "2");

        this.anchor = new Endpoint(x, y, this, 'anchor');
        this.endpoint = new Endpoint(endpointX, endpointY, this, 'endpoint');
    }

    updateD() {
        this.d = "M" + this.x + " " + this.y + " L" + this.endpointX + " " + this.endpointY;
        this.svg.setAttribute('d', this.d);
        this.expandedSVG.setAttribute('d', this.d);
        this.updateCenter();
    }

    setColor(color) {
        super.setColor(color);
        this.svg.setAttribute('stroke', color);
    }

    updateEndpoint(x, y) {
        this.endpointX = x;
        this.endpointY = y;
        this.updateD();
    }

    updateAnchor(x, y) {
        this.x = x;
        this.y = y;
        this.updateD();
    }

    getLength() {
        return Math.sqrt(Math.pow(this.x - this.endpointX,2) + Math.pow(this.y - this.endpointY,2));
    }

    highlightOn() {
        this.svg.setAttribute('stroke', "green");
        this.anchor.show();
        this.endpoint.show();
    }

    highlightOff() {
        this.svg.setAttribute('stroke', this.color);
        this.anchor.hide();
        this.endpoint.hide();
    }

    shift(dx, dy) {
        this.anchor.shift(dx, dy);
        this.endpoint.shift(dx, dy);
    }

    destroy() {
        this.endpoint.destroy();
        this.anchor.destroy();
        this.g.removeChild(this.expandedSVG);
        super.destroy();
    }

    updateCenter() {
        this.centerX = (this.x + this.endpointX) / 2;
        this.centerY = (this.y + this.endpointY) / 2;
    }


    static split(line, x, y, hedges, lines) {
        //TODO make sure no lines are of 0 length
        HalfEdge.removeEdge(line.endpointHedge, hedges);
        lines.splice(lines.indexOf(line), 1);
        line.destroy();

        let line1 = new Line(line.anchor.x, line.anchor.y, x, y, "#ff0000");
        let line2 = new Line(x, y, line.endpoint.x, line.endpoint.y, "#ff0000");

        let endVertex = Vertex.addVertex(line.endpoint.x, line.endpoint.y, hedges);
        let centerVertex = Vertex.addVertex(x, y, hedges);
        let beginningVertex = Vertex.addVertex(line.anchor.x, line.anchor.y, hedges);

        endVertex.points.splice(endVertex.points.indexOf(line.endpoint), 1);
        beginningVertex.points.splice(beginningVertex.points.indexOf(line.anchor), 1);

        line1.render();
        line1.anchor.hide();
        line1.endpoint.hide();
        line2.render();
        line2.anchor.hide();
        line2.endpoint.hide();

        line1.setID(Util.emptySlot(lines));
        lines[line1.id] = line1;
        line2.setID(Util.emptySlot(lines));
        lines[line2.id] = line2;

        line1.anchor.vertex = beginningVertex;
        line1.endpoint.vertex = centerVertex;
        line2.anchor.vertex = centerVertex;
        line2.endpoint.vertex = endVertex;


        beginningVertex.points.push(line1.anchor);
        centerVertex.points.push(line1.endpoint);
        endVertex.points.push(line2.endpoint);
        centerVertex.points.push(line2.anchor);

        HalfEdge.addEdge(beginningVertex, centerVertex, line1, hedges);
        HalfEdge.addEdge(centerVertex, endVertex, line2, hedges);
        return {u: line1, v: line2, center: centerVertex};
    }
}