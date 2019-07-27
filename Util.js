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
        // noinspection ES6ModulesDependencies
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


    /***
     * Inefficient O(n) point location algorithm
     * @param x
     * @param y
     * @param hedges
     * @return {Face}
     */
    static getFace(x, y, hedges) {
        //Find the hedge right above the x,y point
        let closestYDistance = Infinity;
        let closestYHedge;
        for (const hedge of hedges) {
            if (hedge.angle < 270 && hedge.angle > 90) {
                let yIntersect = hedge.yIntersect(x);
                if (yIntersect !== null && yIntersect <= y) {
                    if ((y - yIntersect) < closestYDistance) {
                        closestYDistance = y - yIntersect;
                        closestYHedge = hedge;
                    }
                }
            }
        }

        if (closestYHedge === undefined) {
            return null;
        }

        return closestYHedge.face;
    }

    static cross(p0x, p0y, p1x, p1y) {
        return p0x * p1y - p0y * p1x;
    }

    static getAllIntersections(lines, baseline) {
        const p0x = baseline.anchor.x;
        const p0y = baseline.anchor.y;
        const p1x = baseline.endpoint.x;
        const p1y = baseline.endpoint.y;

        const rX = (p1x - p0x);
        const rY = (p1y - p0y);

        let intersections = [];

        for (const line of lines.filter(l => l instanceof Line)) {
            const p2x = line.anchor.x;
            const p2y = line.anchor.y;
            const p3x = line.endpoint.x;
            const p3y = line.endpoint.y;

            const sX = (p3x - p2x);
            const sY = (p3y - p2y);


            const rsCross = Util.cross(rX, rY, sX, sY);
            if (rsCross !== 0) {
                const t = Util.cross(p2x - p0x, p2y - p0y, sX, sY) / rsCross;
                const u = Util.cross(p2x - p0x, p2y - p0y, rX, rY) / rsCross;

                if (0 <= t && t <= 1 && 0 <= u && u <= 1) {
                    const intersectX = Math.round(p0x + t * rX);
                    const intersectY = Math.round(p0y + t * rY);

                    if (Util.distance(p0x, intersectX, p0y, intersectY) > 5
                        && Util.distance(p1x, intersectX, p1y, intersectY) > 5) {
                        intersections.push({line: line, x: intersectX, y: intersectY});
                    }
                }
            }
        }
        return intersections;
    }


    static getFirstIntersection(lines, baseline) {
        const p0x = baseline.anchor.x;
        const p0y = baseline.anchor.y;
        const p1x = baseline.endpoint.x;
        const p1y = baseline.endpoint.y;

        const rX = (p1x - p0x);
        const rY = (p1y - p0y);

        for (const line of lines.filter(l => l instanceof Line)) {
            const p2x = line.anchor.x;
            const p2y = line.anchor.y;
            const p3x = line.endpoint.x;
            const p3y = line.endpoint.y;

            const sX = (p3x - p2x);
            const sY = (p3y - p2y);


            const rsCross = Util.cross(rX, rY, sX, sY);
            if (rsCross !== 0) {
                const t = Util.cross(p2x - p0x, p2y - p0y, sX, sY) / rsCross;
                const u = Util.cross(p2x - p0x, p2y - p0y, rX, rY) / rsCross;

                if (0 <= t && t <= 1 && 0 <= u && u <= 1) {
                    const intersectX = Math.round(p0x + t * rX);
                    const intersectY = Math.round(p0y + t * rY);

                    if (Util.distance(p0x, intersectX, p0y, intersectY) > 5
                        && Util.distance(p1x, intersectX, p1y, intersectY) > 5) {
                        return {line: line, x: intersectX, y: intersectY};
                    }
                }
            }
        }
    }
}
