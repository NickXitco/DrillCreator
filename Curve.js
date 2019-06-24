class Curve extends Line {
    controlPointX;
    controlPointY;

    controlPointSVG = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    constructor (x, y, endpointX, endpointY, color) {
        super(x, y, endpointX, endpointY, color);
        this.controlPointSVG.setAttribute('r', "5");
        this.controlPointSVG.setAttribute('style', "stroke:purple;stroke-width:1;fill:purple;fill-opacity: 0.5");
        this.resetControlPoint();

        //TODO hover effects
    }

    render() {
        super.render();
        this.g.appendChild(this.controlPointSVG);
    }

    updateD() {
        this.d = "M" + this.x + " " + this.y + " Q" + this.controlPointX + " " + this.controlPointY + " " + this.endpointX + " " + this.endpointY;
        this.svg.setAttribute('d', this.d);
        this.expandedSVG.setAttribute('d', this.d);
        Line.createAnchorPoint(this.anchorSVG, this.x, this.y);
        Line.createAnchorPoint(this.endpointSVG, this.endpointX, this.endpointY);
        this.updateCenter();
    }

    updateControlPoint(x, y) {
        this.controlPointX = x;
        this.controlPointY = y;
        this.controlPointSVG.setAttribute('cx', this.controlPointX);
        this.controlPointSVG.setAttribute('cy', this.controlPointY);
        this.updateD();
    }

    resetControlPoint() {
        this.updateControlPoint((this.x + this.endpointX) / 2, (this.y + this.endpointY) / 2);
    }

    destroy() {
        super.destroy();
        this.g.removeChild(this.controlPointSVG);
        delete this.controlPointSVG;
    }

    hideControlPoint() {
        this.controlPointSVG.removeAttribute('id');
        this.controlPointSVG.setAttribute('visibility', "hidden");
    }

    setActiveControlPoint() {
        this.controlPointSVG.setAttribute('id', "activeControlPoint");
        this.controlPointSVG.setAttribute('visibility', "visible");
    }

    selectShift(x, y) {
        this.updateControlPoint(this.controlPointX + x, this.controlPointY + y);
        super.selectShift(x, y);
    }

    updateCenter() {
        this.centerX = 0.25 * this.x + 0.5 * this.controlPointX + 0.25 * this.endpointX;
        this.centerY = 0.25 * this.y + 0.5 * this.controlPointY + 0.25 * this.endpointY;
    }

}