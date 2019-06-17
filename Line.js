class Line extends Canvas_Primitive {
    endpointX;
    endpointY;

    constructor (x, y, endpointX, endpointY, color) {
        super(x, y, color);
        this.endpointX = endpointX;
        this.endpointY = endpointY;
        this.svg.setAttribute('stroke-width', "2");
    }

    updateD() {
        this.d = "M" + this.x + " " + this.y + " L" + this.endpointX + " " + this.endpointY;
        this.svg.setAttribute('d', this.d);
    }

    setColor(color) {
        this.color = color;
        this.svg.setAttribute('stroke', color);
    }

    updateEndpoint(x, y) {
        this.endpointX = x;
        this.endpointY = y;
        this.updateD()
    }

    updateAnchor(x, y) {
        this.x = x;
        this.y = y;
        this.updateD()
    }
}