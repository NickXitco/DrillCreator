/*global activeCurve*/

class Curve extends Line {
    controlPointX;
    controlPointY;

    controlPointSVG;
    //controlPointVisible = true;

    constructor (x, y, endpointX, endpointY, color) {
        super(x, y, endpointX, endpointY, color);
        this.controlPointSVG = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.controlPointSVG.setAttribute('r', 5);
        this.controlPointSVG.setAttribute('style', "stroke:purple;stroke-width:1;fill:purple;fill-opacity: 0");
        this.g.appendChild(this.controlPointSVG);
        this.resetControlPoint();

        //TODO hover effects
        this.controlPointSVG.addEventListener("mousedown", evt => this.controlPointDown(evt));
        this.controlPointSVG.addEventListener("mouseup", evt => this.controlPointLeave(evt));
    }

    updateD() {
        this.d = "M" + this.x + " " + this.y + " Q" + this.controlPointX + " " + this.controlPointY + " " + this.endpointX + " " + this.endpointY;
        this.svg.setAttribute('d', this.d);
    }

    updateControlPoint(x, y) {
        this.controlPointX = x;
        this.controlPointY = y;
        this.controlPointSVG.setAttribute('cx', this.controlPointX);
        this.controlPointSVG.setAttribute('cy', this.controlPointY);
        this.updateD()
    }

    resetControlPoint() {
        this.updateControlPoint((this.x + this.endpointX) / 2, (this.y + this.endpointY) / 2);
    }

    //TODO figure out how to properly reference the variable from behavior.js
    controlPointDown() {
        if(activeCurve == null) {
            activeCurve = this;
        }
    }

    controlPointLeave() {
        activeCurve = null;
        this.controlPointSVG.setAttribute('style', "stroke:purple;stroke-width:1;fill:purple;fill-opacity: 0");
    }

    destroy() {
        super.destroy();
        this.g.removeChild(this.controlPointSVG);
        delete this.controlPointSVG;
    }
}