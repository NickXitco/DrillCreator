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
        if (selection.primitives.length > 1 && selection.primitives.includes($(e.target).data().self)) {
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

function selectUp(bools, selection, lines, hedges, faces) {
    if (bools.multiSelecting) {
        multiSelect(selection, bools, lines);
        selection.rect.removeAttribute('x');
        selection.rect.removeAttribute('y');
        selection.rect.removeAttribute('width');
        selection.rect.removeAttribute('height');
    } else if (bools.movingSelection) {
        bools.movingSelection = false;
    }

    for (const face of faces) {
        if (!face.global) {
            face.destroy();
        }
    }
    faces.splice(0, faces.length);

    let selectedVertices = [];
    let skipped = [];
    for (const prim of selection.primitives) {
        if (prim instanceof Line) {
            if (prim instanceof Curve) {
                skipped.push(updateVertex(prim.controlPoint.vertex, prim.controlPoint, selectedVertices, hedges));
            }
            skipped.push(updateVertex(prim.anchor.vertex, prim.anchor, selectedVertices, hedges));
            skipped.push(updateVertex(prim.endpoint.vertex, prim.endpoint, selectedVertices, hedges));
        } else if (prim instanceof Point) {
            skipped.push(updateVertex(prim.vertex, prim, selectedVertices, hedges));
        }
    }

    for (const skip of skipped) {
        if (skip !== undefined) {
            if (skip.delete) {
                let line = skip.point.parentLine;
                line.destroy();
                hedges.splice(hedges.indexOf(line.anchorHedge), 1);
                hedges.splice(hedges.indexOf(line.endpointHedge), 1);
                line.anchorHedge.origin.edges.splice(line.anchorHedge.origin.edges.indexOf(line.anchorHedge), 1);
                line.endpointHedge.origin.edges.splice(line.endpointHedge.origin.edges.indexOf(line.endpointHedge), 1);
                HalfEdge.removeEdge(skip.point.parentLine.anchorHedge);
            } else {
                updateVertex(skip.vertex, skip.point, selectedVertices, hedges);
            }
        }
    }

    let vertexToOldEdges = [];
    for (const vertex of selectedVertices) {
        let oldEdges = [...vertex.edges];
        let oldTwins = [];
        for (const hedge of oldEdges) {
            oldTwins.push(hedge.twin);
            let twinVertex = hedge.twin.origin;
            for (let i = twinVertex.edges.length - 1; i >= 0; i--) {
                if (twinVertex.edges[i] === hedge.twin) {
                    twinVertex.edges.splice(i, 1);
                }
            }
        }
        vertex.edges = [];
        for (let i = hedges.length - 1; i >= 0; i--) {
            if (oldEdges.includes(hedges[i]) || oldTwins.includes(hedges[i])) {
                hedges.splice(i, 1);
            }
        }
        vertexToOldEdges.push({v: vertex, e: oldEdges});
    }

    for (const pair of vertexToOldEdges) {
        const vertex = pair.v;
        const oldEdges = pair.e;
        for (const hedge of oldEdges) {
            let to = hedge.destination();
            let from = vertex;
            HalfEdge.removeEdge(hedge);
            HalfEdge.addEdge(from, to, hedge.line,hedges);
        }
    }

    for (const face of Face.assessFaces(hedges)) {
        faces.push(face);
    }
}

function updateVertex(vertex, point, selectedVertices, hedges) {
    if (!selectedVertices.includes(vertex)) {
        let splitPointFlag = false;
        let splitPoint;
        for (const p of vertex.points) {
            if (p.x !== point.x || p.y !== point.y) {
                splitPointFlag = true;
                splitPoint = p;
            }
        }

        let vertices = [];
        for (const hedge of hedges) {
            if (!vertices.includes(hedge.origin)) {
                vertices.push(hedge.origin);
            }
        }

        if (splitPointFlag) {
            vertex.points = vertex.points.filter(p => p !== point);
            let newVertex = Vertex.addVertex(point.x, point.y, hedges);
            if (!newVertex.points.includes(point)) {
                newVertex.points.push(point);
            }
            point.vertex = newVertex;
            for (const hedge of vertex.edges) {
                if (hedge.line === point.parentLine) {
                    let from = newVertex;
                    let to = hedge.destination();
                    if (from === to) {
                        vertex.points.push(point);
                        point.vertex = vertex;
                        if (point.parentLine.getLength() === 0) {
                            return {vertex, point, delete: true};
                        }
                        return {vertex, point, delete: false};
                    }
                    hedges.splice(hedges.indexOf(hedge), 1);
                    hedges.splice(hedges.indexOf(hedge.twin), 1);
                    hedge.origin.edges.splice(hedge.origin.edges.indexOf(hedge), 1);
                    hedge.twin.origin.edges.splice(hedge.twin.origin.edges.indexOf(hedge.twin), 1);
                    HalfEdge.removeEdge(hedge);
                    HalfEdge.addEdge(from, to, point.parentLine, hedges);
                }
            }
            updateVertex(newVertex, point, selectedVertices, hedges);
        } else {
            let match = Vertex.vertexSearch(point.x, point.y, hedges);
            if (match == null || match === vertex) {
                vertex.x = point.x;
                vertex.y = point.y;
                selectedVertices.push(vertex);
            } else {
                for (const hedge of point.vertex.edges) {
                    hedge.origin = match;
                    match.edges.push(hedge);
                }
                point.vertex = match;
                match.points.push(point);
                selectedVertices.push(match);
            }
        }
    }
}