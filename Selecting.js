function multiSelect(selection, bools, lines) {
    const xMin = parseInt(selection.rect.getAttribute('x'));
    const xMax = parseInt(selection.rect.getAttribute('width')) + xMin;
    const yMin = parseInt(selection.rect.getAttribute('y'));
    const yMax = parseInt(selection.rect.getAttribute('height')) + yMin;

    for (const prim of lines) {
        if (prim instanceof Line) {
            if (prim.x >= xMin && prim.x <= xMax && prim.endpointX >= xMin && prim.endpointX <= xMax && prim.y >= yMin && prim.y <= yMax && prim.endpointY >= yMin && prim.endpointY <= yMax) {
                selection.primitives.push(prim);
                prim.highlightOn();
            } else if (prim.x >= xMin && prim.x <= xMax && prim.y >= yMin && prim.y <= yMax) {
                selection.primitives.push(prim.anchor);
                prim.anchor.show();
            } else if (prim.endpointX >= xMin && prim.endpointX <= xMax && prim.endpointY >= yMin && prim.endpointY <= yMax) {
                selection.primitives.push(prim.endpoint);
                prim.endpoint.show();
            }
        }
    }

    bools.multiSelecting = false;
    selection.rect.setAttribute('width', "0");
    selection.rect.setAttribute('height', "0");
    g.removeChild(selection.rect);
}

function singleSelect(e, selection) {
    let hit = $(e.target).data().self;
    if (hit instanceof Line) {
        selection.primitives.push(hit);
        hit.highlightOn();
        if (hit instanceof Curve) {
            hit.controlPoint.show();
        }
    } else if (hit instanceof Point) {
        hit.show();
        hit.parentLine.highlightOn();
        selection.primitives.push(hit);
    }
}

function deselect(selection) {
    for (const prim of selection.primitives) {
        if (prim instanceof Point) {
            prim.hide();
            prim.parentLine.highlightOff();
        }
        if (prim instanceof Curve) {
            prim.controlPoint.hide();
        }
        if (prim instanceof Line) {
            prim.highlightOff();
        }
    }
    selection.primitives = [];
}

function selectDown(e, x, y, down, bools, selection) {
    down.x = x;
    down.y = y;
    if (e.target.id !== "gridRect" && e.target.id !== "svgMain") {
        //User clicked something
        if (selection.primitives.length > 1) { //TODO refine this condition, right now it's just not even correct.
            bools.movingSelection = true;
        } else {
            deselect(selection);
            singleSelect(e, selection);
            bools.movingSelection = true;
        }
    } else {
        //User didn't click something, start multi-select
        deselect(selection);
        bools.multiSelecting = true;
        selection.rect.setAttribute('x', x);
        selection.rect.setAttribute('y', y);
        g.appendChild(selection.rect);
    }
}

function selectMove(x, y, down, selection, lines) {
    for (const prim of selection.primitives) {
        prim.shift(x - down.x, y - down.y);
        if (selection.primitives.length === 1) {
            if (prim instanceof Line) {
                let snappedXY = Util.shiftSnap(prim, lines);
                if (snappedXY !== undefined) {
                    if (snappedXY.endpoint === 1) {
                        //snap anchor
                        prim.shift(snappedXY.closestPoint.x - prim.x, snappedXY.closestPoint.y - prim.y);
                    } else {
                        //snap endpoint
                        prim.shift(snappedXY.closestPoint.x - prim.endpointX, snappedXY.closestPoint.y - prim.endpointY);
                    }
                }
            } else {
                let snappedXY = Util.pointSnap(prim, lines);
                if (snappedXY !== undefined) {
                    prim.setLocation(snappedXY.x, snappedXY.y);
                }
            }
        } else {
            //TODO figure out multi-snapping
        }
    }
    down.x = x;
    down.y = y;
}

function moveMultiSelectRect(x, y, down, selection) {
    if ((x - down.x) >= 0) {
        selection.rect.setAttribute('width', (x - down.x).toString());
    } else {
        selection.rect.setAttribute('x', (x).toString());
        selection.rect.setAttribute('width', (down.x - x).toString());
    }

    if ((y - down.y) >= 0) {
        selection.rect.setAttribute('height', (y - down.y).toString());
    } else {
        selection.rect.setAttribute('y', (y).toString());
        selection.rect.setAttribute('height', (down.y - y).toString());
    }
}

function selectUp(bools, selection, lines) {
    if (bools.multiSelecting) {
        multiSelect(selection, bools, lines);
        selection.rect.removeAttribute('x');
        selection.rect.removeAttribute('y');
        selection.rect.removeAttribute('width');
        selection.rect.removeAttribute('height');
    } else if (bools.movingSelection) {
        bools.movingSelection = false;
    }
}
