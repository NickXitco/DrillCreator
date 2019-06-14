class Curve extends Line {
    controlPointX;
    controlPointY;

    controlPointSVG;
    controlPointVisible = true;

    controlPointLock = true;

    constructor (x, y, endpointX, endpointY, color) {
        super(x, y, endpointX, endpointY, color);
        this.controlPointSVG = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.controlPointSVG.setAttribute('r', 5);
        this.controlPointSVG.setAttribute('style', "stroke:purple;stroke-width:1;fill:purple;fill-opacity: 0");
        this.g.appendChild(this.controlPointSVG);
        //TODO right now this is subject to us outrunning the circle with our mouse and cancelling the event.
        this.controlPointSVG.addEventListener("mouseenter", evt => this.controlPointEnter(evt));
        this.controlPointSVG.addEventListener("mousedown", evt => this.controlPointDown(evt));
        this.controlPointSVG.addEventListener("mousemove", evt => this.controlPointDrag(evt));
        this.controlPointSVG.addEventListener("mouseleave", evt => this.controlPointLeave(evt));
        this.controlPointSVG.addEventListener("mouseup", evt => this.controlPointLeave(evt));
        console.log(this)
    }

    updateD() {
        if (this.endpointX === undefined && this.endpointY === undefined) {
            this.endpointX = this.x;
            this.endpointY = this.y;
        }

        if (this.controlPointX === undefined && this.controlPointY === undefined) {
            this.controlPointX = this.x;
            this.controlPointY = this.y;
        }

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

    controlPointEnter(e){
        this.controlPointSVG.setAttribute('style', "stroke:purple;stroke-width:1;fill:purple;fill-opacity: 0.1");
    }

    controlPointDown(e) {
        this.controlPointLock = false;
    }

    controlPointDrag(e) {
        if (!this.controlPointLock) {
            let virtualXY = Curve.getSvgPoint(e.offsetX, e.offsetY, this.canvas, this.g);
            let x = Curve.round(virtualXY.x, 1); // TODO currently the grid multiple is hardcoded in
            let y = Curve.round(virtualXY.y, 1); // TODO this is obviously not correct and should be fixed when
            // TODO we implement this for "real"
            this.updateControlPoint(x, y);
        }
    }

    controlPointLeave(e) {
        this.controlPointSVG.setAttribute('style', "stroke:purple;stroke-width:1;fill:purple;fill-opacity: 0");
        this.controlPointLock = true;
    }


    // TODO REFACTOR THESE PLEASE FOR THE LOVE OF GOD
    static round(num, gridMultiple) {
        if (num % gridMultiple === 0) {
            return num
        } else if (num % gridMultiple < gridMultiple/2) {
            return num - (num % gridMultiple);
        } else {
            return num + (gridMultiple - num % gridMultiple);
        }
    }

    /**
     * Transforms 'regular' coordinates into virtual SVG coordinates.
     * @param x "Real" Screen X coordinate
     * @param y "Real" Screen Y coordinate
     * @param svgCanvas Canvas to manipulate point on
     * @param g SVG G object containing the transformation
     * @returns svgDropPoint a DOM with a "Virtual" SVG X and Y attached.
     */
    static getSvgPoint(x, y, svgCanvas, g) {
        let svgDropPoint = svgCanvas.createSVGPoint();

        svgDropPoint.x = x;
        svgDropPoint.y = y;

        svgDropPoint = svgDropPoint.matrixTransform(g.getCTM().inverse());
        return svgDropPoint;
    }
}