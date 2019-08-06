class Line extends Canvas_Primitive {
    endpointX;
    endpointY;

    centerX;
    centerY;

    anchor;
    endpoint;

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

    getBoundingBox() {
        let bbox = this.svg.getBBox();
        if (bbox.width === 0 && bbox.height === 0) {
            this.g.appendChild(this.svg);
            bbox = this.svg.getBBox();
            this.g.removeChild(this.svg);
        }

        if (bbox.width === 0) {
            bbox.width += 0.48;
            bbox.x -= 0.24;
        }

        if (bbox.height === 0) {
            bbox.height += 0.48;
            bbox.y -= 0.24;
        }
        return {xMin: bbox.x, yMin: bbox.y, xMax: bbox.x + bbox.width, yMax: bbox.y + bbox.height};
    }

    static boundingBoxOverlap(bbox1, bbox2) {
        return bbox1.xMin < bbox2.xMax && bbox2.xMin < bbox1.xMax && bbox1.yMin < bbox2.yMax && bbox2.yMin < bbox1.yMax;
    }

    virtualSplit(t) {
        const x = Math.round(Util.linearBezierFromT(this.anchor.x, this.endpoint.x, t));
        const y = Math.round(Util.linearBezierFromT(this.anchor.y, this.endpoint.y, t));

        let line1 = new Line(this.anchor.x, this.anchor.y, x, y, "");
        line1.highlightOff();
        line1.updateD();
        let line2 = new Line(x, y, this.endpoint.x, this.endpoint.y, "");
        line2.highlightOff();
        line2.updateD();

        return {a: line1, b: line2};
    }

    split(t, hedges, lines) {
        const x = Math.round(Util.linearBezierFromT(this.anchor.x, this.endpoint.x, t));
        const y = Math.round(Util.linearBezierFromT(this.anchor.y, this.endpoint.y, t));

        //TODO make sure no lines are of 0 length
        HalfEdge.removeEdge(this.endpoint.outgoingHedge, hedges);
        lines.splice(lines.indexOf(this), 1);
        this.destroy();

        let line1 = new Line(this.anchor.x, this.anchor.y, x, y, "#ff0000");
        let line2 = new Line(x, y, this.endpoint.x, this.endpoint.y, "#ff0000");

        let endVertex = Vertex.addVertex(this.endpoint.x, this.endpoint.y, hedges);
        let centerVertex = Vertex.addVertex(x, y, hedges);
        let beginningVertex = Vertex.addVertex(this.anchor.x, this.anchor.y, hedges);

        endVertex.points.splice(endVertex.points.indexOf(this.endpoint), 1);
        beginningVertex.points.splice(beginningVertex.points.indexOf(this.anchor), 1);

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

    sortPoints(points) {
        let rotatedPoints = this.rotatePoints(points).sort(function (a, b) {
            return a.x - b.x;
        });
        return this.unRotatePoints(rotatedPoints);
    }

    /***
     * Rotates a set of points relative to the curve's anchor and endpoint shifted to y=0.
     */
    rotatePoints(points) {
        let translatedPoints = points.slice();
        for (const point of translatedPoints) {
            point.x -= this.anchor.x;
            point.y -= this.anchor.y;
        }
        const angle = -1 * (Math.PI/180) * HalfEdge.getAngle(0, 0, this.endpoint.x - this.anchor.x, this.endpoint.y - this.anchor.y);
        let rotatedPoints = translatedPoints.slice();
        for (const point of rotatedPoints) {
            let oldX = point.x;
            let oldY = point.y;
            point.x = (oldX * Math.cos(angle)) - (oldY * Math.sin(angle));
            point.y = (oldX * Math.sin(angle)) + (oldY * Math.cos(angle));
        }
        return rotatedPoints;
    }

    /***
     * Inverse of rotatePoints()
     * @param rotatedPoints
     * @return {*}
     */
    unRotatePoints(rotatedPoints) {
        const angle = (Math.PI/180) * HalfEdge.getAngle(0, 0, this.endpoint.x - this.anchor.x, this.endpoint.y - this.anchor.y);
        let translatedPoints = rotatedPoints.slice();
        for (const point of translatedPoints) {
            let oldX = point.x;
            let oldY = point.y;
            point.x = (oldX * Math.cos(angle)) - (oldY * Math.sin(angle));
            point.y = (oldX * Math.sin(angle)) + (oldY * Math.cos(angle));
        }
        let points = translatedPoints.slice();
        for (const point of points) {
            point.x += this.anchor.x;
            point.y += this.anchor.y;
        }
        return points;
    }
}