function multiSelect(selection, bools, lines) {
    const xMin = parseInt(selection.rect.getAttribute('x'));
    const xMax = parseInt(selection.rect.getAttribute('width')) + xMin;
    const yMin = parseInt(selection.rect.getAttribute('y'));
    const yMax = parseInt(selection.rect.getAttribute('height')) + yMin;

    for (const prim of lines) {
        if (prim !== undefined) {
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
    } else if (hit instanceof Person) {
        hit.highlightOn();
        selection.objects.push(hit);
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

    for (const obj of selection.objects) {
        obj.highlightOff();
    }
    selection.objects = [];
    selection.primitives = [];
}

function selectDown(e, x, y, down, bools, selection) {
    down.x = x;
    down.y = y;
    if (e.target.id !== "gridRect" && e.target.id !== "svgMain") {
        //User clicked something
        bools.movingSelection = true;
        if (!(selection.primitives.length > 1 && selection.primitives.includes($(e.target).data().self) || selection.objects.length > 1 && selection.objects.includes($(e.target).data().self))) {
            deselect(selection);
            singleSelect(e, selection);
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

    for (const obj of selection.objects) {
        obj.shift(x - down.x, y - down.y);
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



function selectUp(bools, selection, lines, hedges, faces) {
    if (bools.multiSelecting) {
        multiSelect(selection, bools, lines);
        selection.rect.removeAttribute('x');
        selection.rect.removeAttribute('y');
        selection.rect.removeAttribute('width');
        selection.rect.removeAttribute('height');
        return;
    } else if (bools.movingSelection) {
        bools.movingSelection = false;
    }

    if (selection.primitives.some(p => p instanceof Face)) {
        return;
    }

    for (const face of faces) {
        if (!face.global) {
            face.destroy();
        }
    }
    faces.splice(0, faces.length);

    replaceLines(selection, lines, hedges);
    handleIntersections(selection, lines, hedges);

    for (const face of Face.assessFaces(hedges)) {
        faces.push(face);
    }
}

function replaceLines(selection, lines, hedges) {
    for (const prim of selection.primitives) {
        let line;
        if (prim instanceof Point) {
            line = prim.parentLine;
        } else {
            line = prim;
        }

        let endVertex = line.endpoint.vertex;
        let beginningVertex = line.anchor.vertex;

        endVertex.points.splice(endVertex.points.indexOf(line.endpoint), 1);
        beginningVertex.points.splice(beginningVertex.points.indexOf(line.anchor), 1);

        endVertex = Vertex.addVertex(line.endpoint.x, line.endpoint.y, hedges);
        beginningVertex = Vertex.addVertex(line.anchor.x, line.anchor.y, hedges);

        line.anchor.vertex = beginningVertex;
        line.endpoint.vertex = endVertex;

        endVertex.points.push(line.endpoint);
        beginningVertex.points.push(line.anchor);

        HalfEdge.removeEdge(line.endpoint.outgoingHedge, hedges);

        if (line instanceof Curve) {
            const cpVertex = line.controlPoint.vertex;
            HalfEdge.removeEdge(line.anchor.outgoingHedge, hedges);

            HalfEdge.addEdge(beginningVertex, cpVertex, line, hedges);
            HalfEdge.addEdge(cpVertex, endVertex, line, hedges);
        } else {
            HalfEdge.addEdge(beginningVertex, endVertex, line, hedges);
        }
    }
}

function handleIntersections(selection, lines, hedges) {
    for (const prim of selection.primitives) {
        let d = prim;
        if (prim instanceof Point) {
            d = prim.parentLine;
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

    }
}