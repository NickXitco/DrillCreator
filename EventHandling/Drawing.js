function drawDown(x, y, activeDrawing, lines) {
    if (currentTool === tools.LINE) {
        activeDrawing.drawing = new Line(x, y, x, y, "#ff0000");
        activeDrawing.type = Line;
    } else if (currentTool === tools.CURVE) {
        activeDrawing.drawing = new Curve(x, y, x, y, "#0000ff");
        activeDrawing.type = Curve;
    }

    let snappedXY = Util.pointSnap(activeDrawing.drawing.endpoint, lines);
    if (snappedXY !== undefined) {
        activeDrawing.drawing.anchor.setLocation(snappedXY.x, snappedXY.y);
    }
    activeDrawing.drawing.render();
    smallGrid.setAttribute('visibility', 'visible');
}

function drawMove(x, y, activeDrawing, lines) {
    activeDrawing.drawing.endpoint.setLocation(x, y);

    let snappedXY = Util.pointSnap(activeDrawing.drawing.endpoint, lines);
    if (snappedXY !== undefined) {
        activeDrawing.drawing.endpoint.setLocation(snappedXY.x, snappedXY.y);
    }

    if (activeDrawing.type === Curve) {
        activeDrawing.drawing.resetControlPoint(); //While drawing a curve we want to keep the control point in the center of the line
    }
}

function drawUp(x, y, activeDrawing, lines, hedges, faces) {
    let d = activeDrawing.drawing;
    d.endpoint.setLocation(x, y);
    let snappedXY = Util.pointSnap(d.endpoint, lines);
    if (snappedXY !== undefined) {
        d.endpoint.setLocation(snappedXY.x, snappedXY.y);
    }

    if (d.getLength() < 5) {
        d.destroy(); //Destroy lines that are too short
    } else {
        let id = Util.emptySlot(lines);
        d.setID(id);
        lines[id] = d;

        for (const face of faces) {
            if (!face.global) {
                face.destroy();
            }
        }
        faces.splice(0, faces.length);

        const anchorVertex = Vertex.addVertex(d.anchor.x, d.anchor.y, hedges);
        const endpointVertex = Vertex.addVertex(d.endpoint.x, d.endpoint.y, hedges);
        anchorVertex.points.push(d.anchor);
        endpointVertex.points.push(d.endpoint);
        d.anchor.vertex = anchorVertex;
        d.endpoint.vertex = endpointVertex;
        if (d instanceof Curve) {
            const v3 = Vertex.addControlPointVertex(d.controlPoint.x, d.controlPoint.y);
            v3.points.push(d.controlPoint);
            d.controlPoint.vertex = v3;
            HalfEdge.addEdge(anchorVertex, v3, d, hedges);
            HalfEdge.addEdge(v3, endpointVertex, d, hedges);
        } else {
            HalfEdge.addEdge(anchorVertex, endpointVertex, d, hedges);
        }

        let intersectionPoints = Util.getAllIntersections(lines, d);

        if (intersectionPoints === null) {
            console.log("Coincidental Lines!");
            //TODO destroy line, reassess faces
        }

        intersectionPoints = intersectionPoints.sort((a, b) =>  b.baselineT - a.baselineT);

        let splitLine = d;
        if (intersectionPoints.length !== 0) {
            while (intersectionPoints.length > 0) {
                const intersection = intersectionPoints.pop();
                const baseSplit = splitLine.split(intersection.baselineT, hedges, lines);
                const collateralSplit = intersection.line.split(intersection.intT, hedges, lines);

                for (const tUpdate of intersectionPoints) {
                    if (baseSplit.u !== null) {
                        tUpdate.baselineT = (tUpdate.baselineT - intersection.baselineT) / (1 - intersection.baselineT);
                    }

                    if (collateralSplit.u !== null && tUpdate.line === intersection.line) {
                        if (tUpdate.intT > intersection.intT) {
                            tUpdate.intT = (tUpdate.intT - intersection.intT) / (1 - intersection.intT);
                            tUpdate.line = collateralSplit.v;
                        } else {
                            tUpdate.intT /= intersection.intT;
                            tUpdate.line = collateralSplit.u;
                        }
                    }
                }

                splitLine = baseSplit.v;
            }
        }

        console.table(HalfEdge.getVertices(hedges));

        for (const face of Face.assessFaces(hedges)) {
            faces.push(face);
        }
    }

    if (activeDrawing.type === Curve) {
        d.controlPoint.hide();
        d.anchor.hide();
        d.endpoint.hide();
    }

    if (activeDrawing.type === Line) {
        d.anchor.hide();
        d.endpoint.hide();
    }
    smallGrid.setAttribute('visibility', 'hidden');
}