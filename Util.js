class Util {
    static round(num, gridMultiple) {
        if (gridMultiple === 0) {
            return num;
        }
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
    
    static emptySlot(array){
        for (let i = 0; i < array.length; i++) {
            if (array[i] === undefined) {
                return i;
            }
        }
        return array.length;
    }

    static distance(x1, x2, y1, y2){
        if(!x2) x2=0;
        if(!y2) y2=0;
        return Math.sqrt( Math.pow((x1-x2), 2) + Math.pow((y1-y2), 2) );
    }

    static vizCenter(region) {
        return polylabel(region);
    }

    static virtualRoundedXY(e, svgCanvas, g, gridMultiple) {
        let virtualXY = Util.getSvgPoint(e.offsetX, e.offsetY, svgCanvas, g);
        let x = Util.round(virtualXY.x, gridMultiple);
        let y = Util.round(virtualXY.y, gridMultiple);
        return {x, y};
    }

    static shiftSnap(line, lines) {
        let closestPoint = {x: null, y: null};
        let closestPointDistance = Infinity;
        let endpoint = 0; //1 for anchor, 2 for endpoint
        for (const prim of lines) {
            if (prim !== undefined) {
                if (prim !== line) {
                    if (this.distance(line.anchor.x, prim.anchor.x, line.anchor.y, prim.anchor.y) < closestPointDistance) {
                        closestPoint.x = prim.anchor.x;
                        closestPoint.y = prim.anchor.y;
                        closestPointDistance = this.distance(line.anchor.x, prim.anchor.x, line.anchor.y, prim.anchor.y);
                        endpoint = 1;
                    }

                    if (this.distance(line.anchor.x, prim.endpoint.x, line.anchor.y, prim.endpoint.y) < closestPointDistance) {
                        closestPoint.x = prim.endpoint.x;
                        closestPoint.y = prim.endpoint.y;
                        closestPointDistance = this.distance(line.anchor.x, prim.endpoint.x, line.anchor.y, prim.endpoint.y);
                        endpoint = 1;
                    }

                    if (this.distance(line.anchor.x, prim.centerX, line.anchor.y, prim.centerY) < closestPointDistance) { // May need to add a small (+- 2) shift to closestDistance to prefer endpoints.
                        closestPoint.x = prim.centerX;
                        closestPoint.y = prim.centerY;
                        closestPointDistance = this.distance(line.anchor.x, prim.centerX, line.anchor.y, prim.centerY);
                        endpoint = 1;
                    }

                    if (this.distance(line.endpoint.x, prim.anchor.x, line.endpoint.y, prim.anchor.y) < closestPointDistance) {
                        closestPoint.x = prim.anchor.x;
                        closestPoint.y = prim.anchor.y;
                        closestPointDistance = this.distance(line.endpoint.x, prim.anchor.x, line.endpoint.y, prim.anchor.y);
                        endpoint = 2;
                    }

                    if (this.distance(line.endpoint.x, prim.endpoint.x, line.endpoint.y, prim.endpoint.y) < closestPointDistance) {
                        closestPoint.x = prim.endpoint.x;
                        closestPoint.y = prim.endpoint.y;
                        closestPointDistance = this.distance(line.endpoint.x, prim.endpoint.x, line.endpoint.y, prim.endpoint.y);
                        endpoint = 2;
                    }

                    if (this.distance(line.endpoint.x, prim.centerX, line.endpoint.y, prim.centerY) < closestPointDistance) { // May need to add a small (+- 2) shift to closestDistance to prefer endpoints.
                        closestPoint.x = prim.centerX;
                        closestPoint.y = prim.centerY;
                        closestPointDistance = this.distance(line.endpoint.x, prim.centerX, line.endpoint.y, prim.centerY);
                        endpoint = 2;
                    }
                }
            }
        }
        if (closestPointDistance <= 7) {
            return {closestPoint, endpoint};
        }
    }

    static pointSnap(endpoint, lines) {
        let x, y;
        x = endpoint.x;
        y = endpoint.y;
        let closestPoint = {x: null, y: null};
        let closestPointDistance = Infinity;

        for (const prim of lines) {
            if (prim !== undefined) {
                if (prim !== endpoint.parentLine) {
                    if (this.distance(x, prim.anchor.x, y, prim.anchor.y) < closestPointDistance) {
                        closestPointDistance = this.distance(x, prim.anchor.x, y, prim.anchor.y);
                        closestPoint.x = prim.anchor.x;
                        closestPoint.y = prim.anchor.y;
                    }

                    if (this.distance(x, prim.centerX, y, prim.centerY) < closestPointDistance) {
                        closestPointDistance = this.distance(x, prim.centerX, y, prim.centerY);
                        closestPoint.x = prim.centerX;
                        closestPoint.y = prim.centerY;
                    }

                    if (this.distance(x, prim.endpoint.x, y, prim.endpoint.y) < closestPointDistance) {
                        closestPointDistance = this.distance(x, prim.endpoint.x, y, prim.endpoint.y);
                        closestPoint.x = prim.endpoint.x;
                        closestPoint.y = prim.endpoint.y;
                    }
                }
            }
        }
        if (closestPointDistance <= 7) {
            return closestPoint;
        }
    }

}
