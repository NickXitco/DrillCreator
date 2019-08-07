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

    /***
     *
     * @param lines
     * @param baseline
     * @return {null|Array} null if coincidental lines, array of intersecting curves otherwise
     */
    static getAllIntersections(lines, baseline) {
        let intersections = [];
        const baselineBBox = baseline.getBoundingBox();
        for (const line of lines.filter (l => l !== baseline)) {
            let intersectionsThisLine = 0;
            if (Line.boundingBoxOverlap(line.getBoundingBox(), baselineBBox)) {
                let curvePairs = [{a: line, b: baseline, atMin: 0, atMax: 1, btMin: 0, btMax: 1}];
                while (curvePairs.length > 0) {
                    const pair = curvePairs.pop();

                    const pairABBox = pair.a.getBoundingBox();
                    const pairBBBox = pair.b.getBoundingBox();

                    if (Math.abs(pairABBox.xMax - pairABBox.xMin) < 0.5 && Math.abs(pairABBox.yMax - pairABBox.yMin) < 0.5 &&
                        Math.abs(pairBBBox.xMax - pairBBBox.xMin) < 0.5 && Math.abs(pairBBBox.yMax - pairBBBox.yMin) < 0.5) {

                        const intX = pairABBox.xMax;
                        const intY = pairABBox.yMax;
                        const intAT = (pair.atMax + pair.atMin) / 2;
                        const intBT = (pair.btMax + pair.btMin) / 2;

                        if (intersectionsThisLine === 0) {
                            intersections.push({line: line, x: intX, y: intY, intT: intAT, baselineT: intBT});
                            intersectionsThisLine++;
                        } else {
                            let merged = false;
                            for (const int of intersections) {
                                const dist = Util.distance(int.x, intX, int.y, intY);
                                if (dist < 5) {
                                    int.x = (int.x + intX) / 2;
                                    int.y = (int.y + intY) / 2;
                                    int.intT = (int.intT + intAT) / 2;
                                    int.baselineT = (int.baselineT + intBT) / 2;
                                    merged = true;
                                    break;
                                }
                            }
                            if (!merged) {
                                intersections.push({line: line, x: intX, y: intY, intT: intAT, baselineT: intBT});
                                intersectionsThisLine++;
                            }
                        }

                        if (intersectionsThisLine > 2) {
                            return null;
                        }
                        continue;
                    }

                    const aSplit = pair.a.virtualSplit(0.5);
                    const bSplit = pair.b.virtualSplit(0.5);


                    if (Line.boundingBoxOverlap(aSplit.a.getBoundingBox(), bSplit.a.getBoundingBox())) {
                        curvePairs.push({a: aSplit.a, b: bSplit.a,
                                         atMin: pair.atMin, atMax: (pair.atMin + pair.atMax) / 2,
                                         btMin: pair.btMin, btMax: (pair.btMin + pair.btMax) / 2});
                    }

                    if (Line.boundingBoxOverlap(aSplit.a.getBoundingBox(), bSplit.b.getBoundingBox())) {
                        curvePairs.push({a: aSplit.a, b: bSplit.b,
                                         atMin: pair.atMin, atMax: (pair.atMin + pair.atMax) / 2,
                                         btMin: (pair.btMin + pair.btMax) / 2, btMax: pair.btMax});
                    }

                    if (Line.boundingBoxOverlap(aSplit.b.getBoundingBox(), bSplit.a.getBoundingBox())) {
                        curvePairs.push({a: aSplit.b, b: bSplit.a,
                                         atMin: (pair.atMin + pair.atMax) / 2, atMax: pair.atMax,
                                         btMin: pair.btMin, btMax: (pair.btMin + pair.btMax) / 2});
                    }

                    if (Line.boundingBoxOverlap(aSplit.b.getBoundingBox(), bSplit.b.getBoundingBox())) {
                        curvePairs.push({a: aSplit.b, b: bSplit.b,
                                         atMin: (pair.atMin + pair.atMax) / 2, atMax: pair.atMax,
                                         btMin: (pair.btMin + pair.btMax) / 2, btMax: pair.btMax});
                    }
                }
            }
        }
        for (const int of intersections) {
            int.x = Math.round(int.x);
            // noinspection JSSuspiciousNameCombination
            int.y = Math.round(int.y);
        }
        return intersections;
    }

    static linearBezierFromT(p0, p1, t) {
        return (1 - t) * p0 + t * p1;
    }

    static quadraticBezierFromT(p0, p1, p2, t) {
        return (1 - t) * (1 - t) * p0 + 2 * t * (1 - t) * p1 + t * t * p2;
    }
}
