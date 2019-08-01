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
    } else if (bools.movingSelection) {
        bools.movingSelection = false;
    }

    for (const face of faces) {
        if (!face.global) {
            face.destroy();
        }
    }
    faces.splice(0, faces.length);

    //fixDCEL(faces, selection, hedges);

    handleVertexSplitting(selection, lines, hedges);
    handleEdgeIntersections(selection, lines, hedges);

    for (const face of Face.assessFaces(hedges)) {
        faces.push(face);
    }
    console.table(Vertex.getVertices(hedges));
    console.table(lines);
    console.table(hedges);
    console.table(faces);
}

function handleVertexSplitting(selection, lines, hedges) {
    /*
    Here's my thesis: we're trying to be too clever.

    Wayyyy too clever with this whole, shifting lines around thing and making sure everything's
    reattached at the end, or more accurately ***HOPING*** everything is reattached at the end.

    So here's my proposal. If the selection has been moved from its original position, AKA, any vertices points
    are in different location, then
        fucking destroy the entire selection
        and build the entire selection back from scratch
    it's not gonna be THAT much more expensive, and for now, it's so much more important that we just have
    something robust, and that is very very robust.


    So here's the layout/plan

        1. Detect whether a change has been made.
        2. If no change, return.
        3. If yes change, delete everything and rebuild it


     There are some intricacies to deal with, and certainly efficiencies to deal with when we start to care
     about that stuff, but for now, just make something nasty and robust, like, a coal engine or something.
     */

}



function handleEdgeIntersections(selection, lines, hedges) {
    for (const prim of selection.primitives) {
        let d = prim;
        if (prim instanceof Point) {
            d = prim.parentLine;
        } else if (prim instanceof Curve) {
            continue; //Can't handle curve intersection right now.
        }
        let intersectingLines = [];

        for (const i of Util.getAllIntersections(lines, d)) {
            intersectingLines.push(i.line);
        }

        if (intersectingLines.length !== 0) {
            recursivelySplit(d, intersectingLines, hedges, lines);
        }
    }
}

function fixDCEL(faces, selection, hedges) {
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
                HalfEdge.removeEdge(skip.point.parentLine.anchorHedge, hedges);
            } else {
                updateVertex(skip.vertex, skip.point, selectedVertices, hedges);
            }
        }
    }

    let oldEdgeLists = [];
    for (const vertex of selectedVertices) {
        let oldEdges = [];
        for (let i = vertex.edges.length - 1; i >=0; i--) {
            oldEdges.push(HalfEdge.removeEdge(vertex.edges[i], hedges));
        }
        oldEdgeLists.push(oldEdges);
    }

    for (const list of oldEdgeLists) {
        for (const hedge of list) {
            let to = hedge.destination();
            let from = hedge.origin;
            HalfEdge.addEdge(from, to, hedge.line, hedges);
        }
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
                    HalfEdge.removeEdge(hedge, hedges);
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