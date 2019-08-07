class ControlPoint extends Point {
    pole;

    constructor(x, y, curve) {
        super(x, y, curve);
        this.pole = document.createElementNS(namespace, "line");
        this.pole.setAttribute('style', "stroke:purple;stroke-width:1");
        this.updatePole();
        this.g.appendChild(this.pole);
    }

    setLocation(x, y) {
        super.setLocation(x, y);
        this.svg.setAttribute('cx', this.x);
        this.svg.setAttribute('cy', this.y);
        this.parentLine.updateD(x, y);
        if (this.vertex !== undefined) {
            this.vertex.x = x;
            this.vertex.y = y;
        }
        this.updatePole();
    }

    updatePole() {
        if (this.pole !== undefined) {
            this.pole.setAttribute('x1', this.x);
            this.pole.setAttribute('y1', this.y);
            this.pole.setAttribute('x2', this.parentLine.centerX);
            this.pole.setAttribute('y2', this.parentLine.centerY);
        }
    }

    show() {
        if (this.visibility === false) {
            this.g.appendChild(this.svg);
            this.g.appendChild(this.pole);
        }
        this.visibility = true;
    }

    hide() {
        if (this.visibility === true) {
            this.g.removeChild(this.svg);
            this.g.removeChild(this.pole);
        }
        this.visibility = false;
    }
}