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

function drawUp(x, y, activeDrawing, lines) {
    activeDrawing.drawing.endpoint.setLocation(x, y);
    let snappedXY = Util.pointSnap(activeDrawing.drawing.endpoint, lines);
    if (snappedXY !== undefined) {
        activeDrawing.drawing.endpoint.setLocation(snappedXY.x, snappedXY.y);
    }

    if (activeDrawing.drawing.getLength() < 5) {
        activeDrawing.drawing.destroy(); //Destroy lines that are too short

    } else {
        let id = Util.emptySlot(lines);
        activeDrawing.drawing.setID(id);
        lines[id] = activeDrawing.drawing;
    }

    if (activeDrawing.type === Curve) {
        activeDrawing.drawing.controlPoint.hide();
    }

    if (activeDrawing.type === Line) {
        activeDrawing.drawing.anchor.hide();
        activeDrawing.drawing.endpoint.hide();
    }
    smallGrid.setAttribute('visibility', 'hidden');
}