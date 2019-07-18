class Curve extends Line {
    controlPoint;

    constructor (x, y, endpointX, endpointY, color) {
        super(x, y, endpointX, endpointY, color);
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

}