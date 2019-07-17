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

        let v1 = Vertex.addVertex(d.anchor.x, d.anchor.y, hedges);
        let v2 = Vertex.addVertex(d.endpoint.x, d.endpoint.y, hedges);
        v1.points.push(d.anchor);
        v2.points.push(d.endpoint);
        d.anchor.vertex = v1;
        d.endpoint.vertex = v2;

        let returnedFaces;

        if (d instanceof Curve) {
            let v3 = Vertex.addVertex(d.controlPoint.x, d.controlPoint.y, hedges);
            v3.points.push(d.controlPoint);
            d.controlPoint.vertex = v3;
            HalfEdge.addEdge(v1, v3, d, hedges, faces);
            returnedFaces = HalfEdge.addEdge(v3, v2, d, hedges, faces);
        } else {
            returnedFaces = HalfEdge.addEdge(v1, v2, d, hedges, faces);
        }

        for (const face of returnedFaces) {
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