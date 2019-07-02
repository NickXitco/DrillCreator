const electron = require('electron');
const {ipcRenderer} = electron;


const createNewButton = document.querySelector('#createNew');
createNewButton.addEventListener('click', openNewItemDialog);

function openNewItemDialog() {
    ipcRenderer.send('new:open');
}

let downX;
let downY;

let activeDrawing = null;
let selectedPrimitive = null;
let movingPrimitive = false;

let movingMultiSelect = false;
let multiSelecting = false;
let selected = [];
let multiSelectRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
multiSelectRect.setAttribute('stroke', 'gray');
multiSelectRect.setAttribute('fill', 'none');
multiSelectRect.setAttribute('stroke-dasharray', '3');


let gridMultiple = 1;

let poiDeleteLock = false;

let pointsOfInterest = new Set();
let regions = new Set();
let edges = new Set();
let lines = [];
let poiIDCounter = 0;


/*
let keyframes = [];

let key = {function: KeyframeFunctions.set_x, object: activeDrawing, value: 400, time: 0};
key.function(key.value, key.object);
*/

let panZoomCanvas = svgPanZoom('#svgMain', {panEnabled: false, beforePan: panCheck, controlIconsEnabled: false, minZoom: 1, dblClickZoomEnabled: false, });
panZoomCanvas.zoom(2);
panZoomCanvas.center();

/**
 * Restricts panning (and consequently the zoom region) to the size of the full container.
 * Don't ask me why the right/bottom edge equations are the way they are. I don't understand why that works.
 * @param oldPan The pan value before the pan step happens
 * @param newPan The hypothetical pan values should the pan step happen normally
 * @return customPan The actual pan step
 */
function panCheck(oldPan, newPan) {
    let customPan = {};
    let leftEdge = 0;
    let topEdge = 0;
    let rightEdge = -1 * canvasDiv.offsetWidth*(panZoomCanvas.getZoom()*2 - 1);
    let bottomEdge = -1 * canvasDiv.offsetHeight*(panZoomCanvas.getZoom()*2 - 1);
    customPan.x = Math.max(rightEdge, Math.min(leftEdge, newPan.x));
    customPan.y = Math.max(bottomEdge, Math.min(topEdge, newPan.y));
    return customPan;
}

svgCanvas.onmousedown = function(e){
    let {x, y} = Util.virtualRoundedXY(e, svgCanvas, g, gridMultiple);
    x = parseInt(x);
    y = parseInt(y);
    if (e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        drawDown(x, y);
    } else if (e.button === 0 && (currentTool === tools.SELECT)) {
        selectDown(e, x, y);
    } else if (e.button === 1) {
        //middle click
        panZoomCanvas.enablePan();
    }
};

svgCanvas.onmousemove = function(e) {
    let {x, y} = Util.virtualRoundedXY(e, svgCanvas, g, gridMultiple);
    x = parseInt(x);
    y = parseInt(y);
    if (activeDrawing != null && e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        drawMove(x, y);
    } else if (currentTool === tools.SELECT) {
        selectMove(x, y);
    }

};

svgCanvas.onmouseup = function(e) {
    let {x, y} = Util.virtualRoundedXY(e, svgCanvas, g, gridMultiple);
    x = parseInt(x);
    y = parseInt(y);
    if (activeDrawing != null && e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        drawUp(x, y);
    } else if (e.button === 0 && currentTool === tools.SELECT) {
        selectUp(x, y);
    } else if (e.button === 1) {
        panZoomCanvas.disablePan();
    }
};

function selectPrimitive(e) {
    if (selectedPrimitive !== $(e.target).data().self) {
        if (selectedPrimitive != null) {
            deselectPrimitive();
        }
        selectedPrimitive = $(e.target).data().self;
        if (selectedPrimitive instanceof Line) {
            selectedPrimitive.highlightOn();
        }
        if (selectedPrimitive instanceof Curve) {
            selectedPrimitive.controlPoint.show();
        }
        if (selectedPrimitive instanceof Point) {
            selectedPrimitive.show();
            selectedPrimitive.parentLine.highlightOn();
        }
        if (selectedPrimitive instanceof Region) {
            selectedPrimitive = null;
            movingPrimitive = false;
        }
    }
    updatePropertyFields(selectedPrimitive);
}

function deselectPrimitive() {
    if (selectedPrimitive != null) {
        if (selectedPrimitive instanceof Curve) {
            selectedPrimitive.controlPoint.hide();
        }
        if (selectedPrimitive instanceof Line) {
            selectedPrimitive.highlightOff();
        }
        if (selectedPrimitive instanceof Point) {
            selectedPrimitive.hide();
            selectedPrimitive.parentLine.highlightOff();
        }
        selectedPrimitive = null;
    }
    updatePropertyFields(selectedPrimitive);
}

function selectDown(e, x, y) {
    downX = x;
    downY = y;
    if (e.target.id !== "gridRect" && e.target.id !== "svgMain") {
        if (selected.length !== 0) { //TODO refine this condition
            movingMultiSelect = true;
        } else {
            selectPrimitive(e);
            movingPrimitive = true;
            poiDeleteLock = true;
        }
    } else if (selectedPrimitive != null) {
        deselectPrimitive();
        multiSelecting = true;
        multiSelectRect.setAttribute('x', x);
        multiSelectRect.setAttribute('y', y);
        g.appendChild(multiSelectRect);
    } else {
        for (const selection of selected) {
            if (selection instanceof Line) {
                selection.highlightOff();
            } else {
                selection.hide();
            }
        }
        selected = [];
        multiSelecting = true;
        multiSelectRect.setAttribute('x', x);
        multiSelectRect.setAttribute('y', y);
        g.appendChild(multiSelectRect);
    }
}



function selectMove(x, y) {
    if (movingPrimitive) {
        if (poiDeleteLock) {
            if (selectedPrimitive instanceof Line) {
                moveLine(selectedPrimitive);
            } else {
                moveLine(selectedPrimitive.parentLine);
            }
            poiDeleteLock = false;
        }

        selectedPrimitive.shift(x - downX, y - downY);
        downX = x;
        downY = y;
        /* TODO there's a sour problem with the shifting one here. Basically when things get snapped, they get "glued"
        *   that is to say that in order to break the snap, you need to yank it out of the snap zone "fast" enough,
        *   as opposed to "far" enough. You have to move the mouse more than 7 units in a single frame in order
        *   for the glue to break, or else it will continue shifting back into place, regardless of how far you've
        *   pulled the primitive.
        * */

        if (selectedPrimitive instanceof Line) {
            let snappedXY = shiftSnap(selectedPrimitive);
            if (snappedXY !== undefined) {
                if (snappedXY.endpoint === 1) {
                    //snap anchor
                    selectedPrimitive.shift(snappedXY.closestPoint.x - selectedPrimitive.x, snappedXY.closestPoint.y - selectedPrimitive.y);
                } else {
                    //snap endpoint
                    selectedPrimitive.shift(snappedXY.closestPoint.x - selectedPrimitive.endpointX, snappedXY.closestPoint.y - selectedPrimitive.endpointY);
                }
            }
        } else {
            let snappedXY = pointSnap(selectedPrimitive);
            if (snappedXY !== undefined) {
                selectedPrimitive.setLocation(snappedXY.x, snappedXY.y);
            }
        }

    } else if (multiSelecting) {
        if ((x - downX) >= 0) {
            multiSelectRect.setAttribute('width', (x - downX).toString());
        } else {
            multiSelectRect.setAttribute('x', (x).toString());
            multiSelectRect.setAttribute('width', (downX - x).toString());
        }

        if ((y - downY) >= 0) {
            multiSelectRect.setAttribute('height', (y - downY).toString());
        } else {
            multiSelectRect.setAttribute('y', (y).toString());
            multiSelectRect.setAttribute('height', (downY - y).toString());
        }
    } else if (movingMultiSelect) {
        for (const selection of selected) {
            selection.shift(x - downX, y - downY);
        }
        downX = x;
        downY = y;
    }

    if (selectedPrimitive === null) {
        updateMouseFields(x, y);
    } else {
        updatePropertyFields(selectedPrimitive);
    }
}

function selectUp(x, y) {
    if (multiSelecting) {
        const xMin = parseInt(multiSelectRect.getAttribute('x'));
        const xMax = parseInt(multiSelectRect.getAttribute('width')) + xMin;
        const yMin = parseInt(multiSelectRect.getAttribute('y'));
        const yMax = parseInt(multiSelectRect.getAttribute('height')) + yMin;

        for (const prim of lines) {
            if (prim instanceof Line) {
                if (prim.x >= xMin && prim.x <= xMax && prim.endpointX >= xMin && prim.endpointX <= xMax && prim.y >= yMin && prim.y <= yMax && prim.endpointY >= yMin && prim.endpointY <= yMax) {
                    selected.push(prim);
                    prim.highlightOn();
                } else if (prim.x >= xMin && prim.x <= xMax && prim.y >= yMin && prim.y <= yMax) {
                    selected.push(prim.anchor);
                    prim.anchor.show();
                } else if (prim.endpointX >= xMin && prim.endpointX <= xMax && prim.endpointY >= yMin && prim.endpointY <= yMax) {
                    selected.push(prim.endpoint);
                    prim.endpoint.show();
                }
            }
        }

        multiSelecting = false;
        multiSelectRect.setAttribute('width', "0");
        multiSelectRect.setAttribute('height', "0");
        g.removeChild(multiSelectRect);
    } else if (movingMultiSelect) {
        movingMultiSelect = false;
    } else if (movingPrimitive) {
        movingPrimitive = false;
    }

    if (selectedPrimitive !==  null) {
        if (selectedPrimitive instanceof Line) {
            checkIntersections(selectedPrimitive, false);
        } else {
            checkIntersections(selectedPrimitive.parentLine, false);
        }
    }
}

function drawDown(x, y) {
    if (currentTool === tools.LINE) {
        activeDrawing = new Line(x, y, x, y, "#ff0000");
    } else if (currentTool === tools.CURVE) {
        activeDrawing = new Curve(x, y, x, y, "#0000ff");
    }

    let snappedXY = pointSnap(activeDrawing.endpoint);
    if (snappedXY !== undefined) {
        activeDrawing.anchor.setLocation(snappedXY.x, snappedXY.y);
    }

    checkIntersections(activeDrawing, true);
    activeDrawing.render();
    smallGrid.setAttribute('visibility', 'visible');
}

function drawMove(x, y) {
    activeDrawing.endpoint.setLocation(x, y);

    let snappedXY = pointSnap(activeDrawing.endpoint);
    if (snappedXY !== undefined) {
        activeDrawing.endpoint.setLocation(snappedXY.x, snappedXY.y);
    }

    if (activeDrawing instanceof Curve) {
        activeDrawing.resetControlPoint(); //While drawing a curve we want to keep the control point in the center of the line
    }
}

function drawUp(x, y) {
    activeDrawing.endpoint.setLocation(x, y);
    let snappedXY = pointSnap(activeDrawing.endpoint);
    if (snappedXY !== undefined) {
        activeDrawing.endpoint.setLocation(snappedXY.x, snappedXY.y);
    }

    if (activeDrawing.getLength() < 5) {
        activeDrawing.destroy(); //Destroy lines that are too short
    } else {
        let id = Util.emptySlot(lines);
        activeDrawing.setID(id);
        lines[id] = activeDrawing;
        checkIntersections(activeDrawing, false);
    }
    if (activeDrawing instanceof Curve) {
        activeDrawing.controlPoint.hide();
    }

    if (activeDrawing instanceof Line) {
        activeDrawing.anchor.hide();
        activeDrawing.endpoint.hide();
    }

    activeDrawing = null;
    smallGrid.setAttribute('visibility', 'hidden');
}

function shiftSnap(line) {
    let closestPoint = {x: null, y: null};
    let closestPointDistance = Infinity;
    let endpoint = 0; //1 for anchor, 2 for endpoint
    for (const prim of lines) {
        if (prim !== line) {
            if (Util.distance(line.anchor.x, prim.anchor.x, line.anchor.y, prim.anchor.y) < closestPointDistance) {
                closestPoint.x = prim.anchor.x;
                closestPoint.y = prim.anchor.y;
                closestPointDistance = Util.distance(line.anchor.x, prim.anchor.x, line.anchor.y, prim.anchor.y);
                endpoint = 1;
            }

            if (Util.distance(line.anchor.x, prim.endpoint.x, line.anchor.y, prim.endpoint.y) < closestPointDistance) {
                closestPoint.x = prim.endpoint.x;
                closestPoint.y = prim.endpoint.y;
                closestPointDistance = Util.distance(line.anchor.x, prim.endpoint.x, line.anchor.y, prim.endpoint.y);
                endpoint = 1;
            }

            if (Util.distance(line.anchor.x, prim.centerX, line.anchor.y, prim.centerY) < closestPointDistance) { // May need to add a small (+- 2) shift to closestDistance to prefer endpoints.
                closestPoint.x = prim.centerX;
                closestPoint.y = prim.centerY;
                closestPointDistance = Util.distance(line.anchor.x, prim.centerX, line.anchor.y, prim.centerY);
                endpoint = 1;
            }

            if (Util.distance(line.endpoint.x, prim.anchor.x, line.endpoint.y, prim.anchor.y) < closestPointDistance) {
                closestPoint.x = prim.anchor.x;
                closestPoint.y = prim.anchor.y;
                closestPointDistance = Util.distance(line.endpoint.x, prim.anchor.x, line.endpoint.y, prim.anchor.y);
                endpoint = 2;
            }

            if (Util.distance(line.endpoint.x, prim.endpoint.x, line.endpoint.y, prim.endpoint.y) < closestPointDistance) {
                closestPoint.x = prim.endpoint.x;
                closestPoint.y = prim.endpoint.y;
                closestPointDistance = Util.distance(line.endpoint.x, prim.endpoint.x, line.endpoint.y, prim.endpoint.y);
                endpoint = 2;
            }

            if (Util.distance(line.endpoint.x, prim.centerX, line.endpoint.y, prim.centerY) < closestPointDistance) { // May need to add a small (+- 2) shift to closestDistance to prefer endpoints.
                closestPoint.x = prim.centerX;
                closestPoint.y = prim.centerY;
                closestPointDistance = Util.distance(line.endpoint.x, prim.centerX, line.endpoint.y, prim.centerY);
                endpoint = 2;
            }
        }
    }
    if (closestPointDistance <= 7) {
        return {closestPoint, endpoint};
    }
}

function pointSnap(endpoint) {
    let x, y;
    x = endpoint.x;
    y = endpoint.y;
    let closestPoint = {x: null, y: null};
    let closestPointDistance = Infinity;

    for (const prim of lines) {
        if (prim !== endpoint.parentLine) {
            if (Util.distance(x, prim.anchor.x, y, prim.anchor.y) < closestPointDistance) {
                closestPointDistance = Util.distance(x, prim.anchor.x, y, prim.anchor.y);
                closestPoint.x = prim.anchor.x;
                closestPoint.y = prim.anchor.y;
            }

            if (Util.distance(x, prim.centerX, y, prim.centerY) < closestPointDistance) {
                closestPointDistance = Util.distance(x, prim.centerX, y, prim.centerY);
                closestPoint.x = prim.centerX;
                closestPoint.y = prim.centerY;
            }

            if (Util.distance(x, prim.endpoint.x, y, prim.endpoint.y) < closestPointDistance) {
                closestPointDistance = Util.distance(x, prim.endpoint.x, y, prim.endpoint.y);
                closestPoint.x = prim.endpoint.x;
                closestPoint.y = prim.endpoint.y;
            }
        }
    }
    if (closestPointDistance <= 7) {
        return closestPoint;
    }
}

function checkIntersections(primitive, newLine) {
    if (primitive instanceof Region) {
        return;
    }

    let point = null;
    for (const neighboring_prim of lines) {
        if (neighboring_prim !== primitive) {
            if (primitive.x === neighboring_prim.x && primitive.y === neighboring_prim.y) {
                addPointOfInterest(primitive.x, primitive.y, primitive);
                point = addPointOfInterest(primitive.x, primitive.y, neighboring_prim);
            }

            if (primitive.x === neighboring_prim.endpointX && primitive.y === neighboring_prim.endpointY) {
                addPointOfInterest(primitive.x, primitive.y, primitive);
                point = addPointOfInterest(primitive.x, primitive.y, neighboring_prim);
            }

            if (!newLine){
                if (primitive.endpointX === neighboring_prim.x && primitive.endpointY === neighboring_prim.y) {
                    addPointOfInterest(primitive.endpointX, primitive.endpointY, primitive);
                    point = addPointOfInterest(primitive.endpointX, primitive.endpointY, neighboring_prim);
                }

                if (primitive.endpointX === neighboring_prim.endpointX && primitive.endpointY === neighboring_prim.endpointY) {
                    addPointOfInterest(primitive.endpointX, primitive.endpointY, primitive);
                    point = addPointOfInterest(primitive.endpointX, primitive.endpointY, neighboring_prim);
                }
            }
        }
    }

    if (point !== null) {
        updateRegions(point);
    }
}

function addPointOfInterest(x, y, prim) {
    for (const point of pointsOfInterest) {
        if (point.x === x && point.y === y) {
            point.primitives.add(prim);
            return point;
        }
    }
    let newPoi = new POI(x, y);
    newPoi.id = poiIDCounter;
    poiIDCounter += 1;
    newPoi.primitives.add(prim);
    pointsOfInterest.add(newPoi);


    //TODO delete debug info
    let newPoiSVG = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    let newPoiID = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    newPoiID.innerHTML = newPoi.id;
    newPoiID.setAttribute('x', x);
    newPoiID.setAttribute('y', y);
    newPoiID.setAttribute('style', "font: 7px sans-serif; fill: white");
    newPoiID.setAttribute('text-anchor', "middle");
    newPoiID.setAttribute('alignment-baseline', "middle");
    newPoiSVG.setAttribute('r', "5");
    newPoiSVG.setAttribute('cx', x);
    newPoiSVG.setAttribute('cy', y);
    g.appendChild(newPoiSVG);
    g.appendChild(newPoiID);

    return newPoi;
}

function addNeighbors(point) {
    for (const other_point of pointsOfInterest) {
        if (other_point !== point) {
            for (const prim of point.primitives) {
                if (other_point.primitives.has(prim)) {
                    point.neighbors.add(other_point);
                }
            }
        }
    }
}

function updateEdges(point) {
    for (const endpoint of point.neighbors) {
        let found = false;
        for (const edge of edges) {
            if (edge[0].id === point.id && edge[1].id === endpoint.id) {
                found = true;
                break;
            } else if (edge[0].id === endpoint.id && edge[1].id === point.id) {
                found = true;
                break;
            }
        }
        if (!found) {
            edges.add([point, endpoint]);
        }
    }
}

function updateRegions(point) {
    addNeighbors(point);
    for (const neighbor of point.neighbors) {
        addNeighbors(neighbor);
    }
    updateEdges(point);
    findShortestSelfCycle(point);
}

function findShortestSelfCycle(source) {
    //TODO I *think* we can drop a path if it becomes longer than any path currently from that node? but we'll have to check... this is weird.
    //TODO However, this is probably *SUPER* unimportant. BFS isn't _that_ expensive.

    let paths = [];
    for (const neighbor of source.neighbors) {

        let path = Util.getShortestCycle(neighbor, source, pointsOfInterest, []);
        if (path != null) {
            paths.push(path);
        }
    }

    for (const path of paths) {
        if (Util.newRegion(path, regions)) {
            createNewRegion(path);
        }
    }
}

function createNewRegion(region){
    let region_object = new Region(region);
    regions.add(region_object);
    region_object.render();
}

function deletePOI(poi) {
    pointsOfInterest.delete(poi);

    for (const region of regions) {
        if (region.path.includes(poi)) {
            regions.delete(region);
            region.destroy();
        }
    }
}

function moveLine(line) {
    let includedPoints = new Set();
    let pointsToUpdate = new Set();
    for (const point of pointsOfInterest) {
        if (point.removeLine(line)) {
            includedPoints.add(point);
        }
        if (point.deleteFlag) {
            includedPoints.delete(point);
            deletePOI(point);
        }
    }

    for (const region of regions) {
        for (const point of region.path) {
            if (includedPoints.has(point)) {
                for (const importantPoint of region.path) {
                    pointsToUpdate.add(importantPoint);
                }
                regions.delete(region);
                region.destroy();
                break;
            }
        }
    }

    for (const edge of edges) {
        if (!pointsOfInterest.has(edge[0]) || !pointsOfInterest.has(edge[1])) {
            edges.delete(edge);
        }
        for (const point of includedPoints) {
            if (edge[0] === point || edge[1] === point) {
                edges.delete(edge);
            }
        }
    }

    for (const p1 of includedPoints) {
        for (const p2 of includedPoints) {
            p1.neighbors.delete(p2);
        }
    }

    for (const p of pointsOfInterest) {
        updateRegions(p);
    }
}


function deletePrimitive(primitive) {
    moveLine(primitive);
    primitive.destroy();
    lines = lines.filter(item => item !== primitive);
}

ipcRenderer.on('item:add', function(){
    //New Item
    const element = document.createElementNS('http://www.w3.org/2000/svg', "circle");
    element.setAttribute('cx', '1500');
    element.setAttribute('cy', '1000');
    element.setAttribute('r', "10");
    element.setAttribute('stroke', "black");
    element.setAttribute('fill', "none");
    g.appendChild(element);
});