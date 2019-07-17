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
}