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

    if (d.getLength() < 5 || (coincidental(d, lines) && !(d instanceof Curve))) {
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
            const v3 = Vertex.addVertex(d.controlPoint.x, d.controlPoint.y, hedges);
            v3.points.push(d.controlPoint);
            d.controlPoint.vertex = v3;
            HalfEdge.addEdge(anchorVertex, v3, d, hedges);
            HalfEdge.addEdge(v3, endpointVertex, d, hedges);
        } else {
            HalfEdge.addEdge(anchorVertex, endpointVertex, d, hedges);
        }


        let intersectingLines = [];

        for (const i of Util.getAllIntersections(lines, d)) {
            intersectingLines.push(i.line);
        }

        if (intersectingLines.length !== 0) {
            recursivelySplit(d, intersectingLines, hedges);
        }

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


function recursivelySplit(line, possibleIntersections, hedges) {
    let i = Util.getFirstIntersection(possibleIntersections, line);
    if (i !== undefined) {
        const baseSplit = Line.split(line, i.x, i.y, hedges);
        Line.split(i.line, i.x, i.y, hedges);
        const u = baseSplit.u;
        const v = baseSplit.v;
        recursivelySplit(u, possibleIntersections, hedges);
        recursivelySplit(v, possibleIntersections, hedges);
    }
}

function coincidental(d, lines) {
    const angle = HalfEdge.getAngle(d.anchor.x, d.anchor.y, d.endpoint.x, d.endpoint.y);

    for (const line of lines) {
        if (line.anchorHedge.angle === angle || line.endpointHedge.angle === angle) {
            const distAB = line.getLength();
            let distAC = Util.distance(line.anchor.x, d.anchor.x, line.anchor.y, d.anchor.y);
            let distBC = Util.distance(line.endpoint.x, d.anchor.x, line.endpoint.y, d.anchor.y);
            if (distAC + distBC === distAB && (distBC > 0) && (distAC > 0)) {
                return true;
            }
            distAC = Util.distance(line.anchor.x, d.endpoint.x, line.anchor.y, d.endpoint.y);
            distBC = Util.distance(line.endpoint.x, d.endpoint.x, line.endpoint.y, d.endpoint.y);
            if (distAC + distBC === distAB && (distBC > 0) && (distAC > 0)) {
                return true;
            }
        }
    }
    return false;
}