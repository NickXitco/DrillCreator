class ControlPoint extends Point {
    constructor(x, y, curve) {
        super(x, y, curve);
    }

    setLocation(x, y) {
        super.setLocation(x, y);
        this.svg.setAttribute('cx', this.x);
        this.svg.setAttribute('cy', this.y);
        this.parentLine.updateD(x, y);
    }
}