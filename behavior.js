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
let movingControlPoint = false;
let movingPrimitive = false;

let movingAnchor = false;
let movingEndpointAnchor = false;

let gridMultiple = 1;

let primitives = [];

let pointsOfInterest = [];
let poiIDCounter = 0;
let edges = [];
let regions = [];

/*
let keyframes = [];

let key = {function: KeyframeFunctions.set_x, object: activeDrawing, value: 400, time: 0};
key.function(key.value, key.object);
*/

let panZoomCanvas = svgPanZoom('#svgMain', {panEnabled: false, beforePan: panCheck, controlIconsEnabled: false, minZoom: 1, dblClickZoomEnabled: false, });
panZoomCanvas.zoom(2);
panZoomCanvas.center();

/*WE WILL need to eventually distinguish primitives from objects, probably based on editing mode.*/

svgCanvas.onmousedown = function(e){
    let {x, y} = virtualRoundedXY(e);
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
    let {x, y} = virtualRoundedXY(e);
    x = parseInt(x);
    y = parseInt(y);
    if (activeDrawing != null && e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        drawMove(x, y);
    } else if (currentTool === tools.SELECT) {
        selectMove(x, y);
    }

};

svgCanvas.onmouseup = function(e) {
    let {x, y} = virtualRoundedXY(e);
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


function virtualRoundedXY(e) {
    let virtualXY = Util.getSvgPoint(e.offsetX, e.offsetY, svgCanvas, g);
    let x = Util.round(virtualXY.x, gridMultiple);
    let y = Util.round(virtualXY.y, gridMultiple);
    return {x, y};
}

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

function selectPrimitive(e) {
    if (selectedPrimitive !== $(e.target).data().self) {
        if (selectedPrimitive != null) {
            deselectPrimitive();
        }
        selectedPrimitive = $(e.target).data().self;
        if (selectedPrimitive instanceof Line) {
            selectedPrimitive.highlightOn();
            selectedPrimitive.showAnchors();
        }
        if (selectedPrimitive instanceof Curve) {
            selectedPrimitive.setActiveControlPoint();
        }
    }
    updatePropertyFields(selectedPrimitive);
}

function deselectPrimitive() {
    if (selectedPrimitive != null) {
        if (selectedPrimitive instanceof Curve) {
            selectedPrimitive.hideControlPoint();
        }
        if (selectedPrimitive instanceof Line) {
            selectedPrimitive.highlightOff();
            selectedPrimitive.hideAnchors();
        }
        selectedPrimitive = null;
    }
    updatePropertyFields(selectedPrimitive);
}

function selectDown(e, x, y) {
    if (e.target.id === "activeControlPoint") {
        movingControlPoint = true;
    } else if (e.target.id === "activeAnchor") {
        movingAnchor = true;
    } else if (e.target.id === "activeEndpointAnchor") {
        movingEndpointAnchor = true;
    } else if (e.target.id !== "gridRect" && e.target.id !== "svgMain") {
        selectPrimitive(e);
        downX = x;
        downY = y;
        movingPrimitive = true;
    } else if (selectedPrimitive != null) {
        deselectPrimitive();
    }
}

function selectMove(x, y) {
    if (movingControlPoint) {
        selectedPrimitive.updateControlPoint(x, y);
    } else if (movingAnchor) {
        selectedPrimitive.updateAnchor(x, y);

        let snappedXY = pointSnap(selectedPrimitive, true);
        if (snappedXY !== undefined) {
            selectedPrimitive.updateAnchor(snappedXY.closestPoint.x, snappedXY.closestPoint.y);
        }

    } else if (movingEndpointAnchor) {
        selectedPrimitive.updateEndpoint(x, y);

        let snappedXY = pointSnap(selectedPrimitive, false);
        if (snappedXY !== undefined) {
            selectedPrimitive.updateEndpoint(snappedXY.closestPoint.x, snappedXY.closestPoint.y);
        }

    } else if (movingPrimitive) {
        selectedPrimitive.selectShift(x - downX, y - downY);
        downX = x;
        downY = y;

        /* TODO there's a sour problem with the shifting one here. Basically when things get snapped, they get "glued"
        *   that is to say that in order to break the snap, you need to yank it out of the snap zone "fast" enough,
        *   as opposed to "far" enough. You have to move the mouse more than 7 units in a single frame in order
        *   for the glue to break, or else it will continue shifting back into place, regardless of how far you've
        *   pulled the primitive.
        * */

        let snappedXY = shiftSnap(selectedPrimitive);
        if (snappedXY !== undefined) {
            if (snappedXY.endpoint === 1) {
                //snap anchor
                selectedPrimitive.selectShift(snappedXY.closestPoint.x - selectedPrimitive.x, snappedXY.closestPoint.y - selectedPrimitive.y);
            } else {
                //snap endpoint
                selectedPrimitive.selectShift(snappedXY.closestPoint.x - selectedPrimitive.endpointX, snappedXY.closestPoint.y - selectedPrimitive.endpointY);
            }
        }
    }

    if (selectedPrimitive === null) {
        updateMouseFields(x, y);
    } else {
        updatePropertyFields(selectedPrimitive);
    }
}

function selectUp(x, y) {
    if (movingControlPoint) {
        selectedPrimitive.updateControlPoint(x, y);
        movingControlPoint = false;
    } else if (movingAnchor) {
        movingAnchor = false;
    } else if (movingEndpointAnchor) {
        movingEndpointAnchor = false;
    }

    if (selectedPrimitive !==  null) {
        checkIntersections(selectedPrimitive, false);
    }
    movingPrimitive = false;
}

function drawDown(x, y) {
    if (currentTool === tools.LINE) {
        activeDrawing = new Line(x, y, x, y, "#ff0000");
    } else if (currentTool === tools.CURVE) {
        activeDrawing = new Curve(x, y, x, y, "#0000ff");
    }

    let snappedXY = pointSnap(activeDrawing, true);
    if (snappedXY !== undefined) {
        activeDrawing.updateAnchor(snappedXY.closestPoint.x, snappedXY.closestPoint.y);
    }

    checkIntersections(activeDrawing, true);
    activeDrawing.render();
    activeDrawing.renderAnchors();
    smallGrid.setAttribute('visibility', 'visible');
}

function drawMove(x, y) {
    activeDrawing.updateEndpoint(x, y);

    let snappedXY = pointSnap(activeDrawing, false);
    if (snappedXY !== undefined) {
        activeDrawing.updateEndpoint(snappedXY.closestPoint.x, snappedXY.closestPoint.y);
    }

    if (activeDrawing instanceof Curve) {
        activeDrawing.resetControlPoint(); //While drawing a curve we want to keep the control point in the center of the line
    }
}

function drawUp(x, y) {
    activeDrawing.updateEndpoint(x, y);
    let snappedXY = pointSnap(activeDrawing, false);
    if (snappedXY !== undefined) {
        activeDrawing.updateEndpoint(snappedXY.closestPoint.x, snappedXY.closestPoint.y);
    }

    if (activeDrawing.getLength() < 5) {
        activeDrawing.destroy(); //Destroy lines that are too short
    } else {
        let id = Util.emptySlot(primitives);
        activeDrawing.setID(id);
        primitives[id] = activeDrawing;
        checkIntersections(activeDrawing, false);
    }
    if (activeDrawing instanceof Curve) {
        activeDrawing.hideControlPoint();
    }

    activeDrawing.hideAnchors();
    activeDrawing = null;

    smallGrid.setAttribute('visibility', 'hidden');
}


function shiftSnap(line) {
    let closestPoint = {x: null, y: null};
    let closestPointDistance = Infinity;
    let endpoint = 0; //1 for anchor, 2 for endpoint
    for (const prim of primitives) {
        if (prim !== line) {

            if (Util.distance(line.x, prim.x, line.y, prim.y) < closestPointDistance) {
                closestPoint.x = prim.x;
                closestPoint.y = prim.y;
                closestPointDistance = Util.distance(line.x, prim.x, line.y, prim.y);
                endpoint = 1;
            }

            if (Util.distance(line.x, prim.endpointX, line.y, prim.endpointY) < closestPointDistance) {
                closestPoint.x = prim.endpointX;
                closestPoint.y = prim.endpointY;
                closestPointDistance = Util.distance(line.x, prim.endpointX, line.y, prim.endpointY);
                endpoint = 1;
            }

            if (Util.distance(line.x, prim.centerX, line.y, prim.centerY) < closestPointDistance) { // May need to add a small (+- 2) shift to closestDistance to prefer endpoints.
                closestPoint.x = prim.centerX;
                closestPoint.y = prim.centerY;
                closestPointDistance = Util.distance(line.x, prim.centerX, line.y, prim.centerY);
                endpoint = 1;
            }

            if (Util.distance(line.endpointX, prim.x, line.endpointY, prim.y) < closestPointDistance) {
                closestPoint.x = prim.x;
                closestPoint.y = prim.y;
                closestPointDistance = Util.distance(line.endpointX, prim.x, line.endpointY, prim.y);
                endpoint = 2;
            }

            if (Util.distance(line.endpointX, prim.endpointX, line.endpointY, prim.endpointY) < closestPointDistance) {
                closestPoint.x = prim.endpointX;
                closestPoint.y = prim.endpointY;
                closestPointDistance = Util.distance(line.endpointX, prim.endpointX, line.endpointY, prim.endpointY);
                endpoint = 2;
            }

            if (Util.distance(line.endpointX, prim.centerX, line.endpointY, prim.centerY) < closestPointDistance) { // May need to add a small (+- 2) shift to closestDistance to prefer endpoints.
                closestPoint.x = prim.centerX;
                closestPoint.y = prim.centerY;
                closestPointDistance = Util.distance(line.endpointX, prim.centerX, line.endpointY, prim.centerY);
                endpoint = 2;
            }
        }
    }
    if (closestPointDistance <= 7) {
        return {closestPoint, endpoint};
    }
}


function pointSnap(line, anchor) {
    let x, y;
    let endpoint = 0; //1 for anchor, 2 for endpoint
    if (anchor) {
        x = line.x;
        y = line.y;
        endpoint = 1;
    } else {
        x = line.endpointX;
        y = line.endpointY;
        endpoint = 2;
    }
    let closestPoint = {x: null, y: null};
    let closestPointDistance = Infinity;

    for (const prim of primitives) {
        if (prim !== line) {

            if (Util.distance(x, prim.x, y, prim.y) < closestPointDistance) {
                closestPoint.x = prim.x;
                closestPoint.y = prim.y;
                closestPointDistance = Util.distance(x, prim.x, y, prim.y);
            }

            if (Util.distance(x, prim.endpointX, y, prim.endpointY) < closestPointDistance) {
                closestPoint.x = prim.endpointX;
                closestPoint.y = prim.endpointY;
                closestPointDistance = Util.distance(x, prim.endpointX, y, prim.endpointY);
            }

            if (Util.distance(x, prim.centerX, y, prim.centerY) < closestPointDistance) { // May need to add a small (+- 2) shift to closestDistance to prefer endpoints.
                closestPoint.x = prim.centerX;
                closestPoint.y = prim.centerY;
                closestPointDistance = Util.distance(x, prim.centerX, y, prim.centerY);
            }
        }
    }
    if (closestPointDistance <= 7) {
        return {closestPoint, endpoint};
    }
}


function checkIntersections(primitive, newLine) {
    if (primitive instanceof Region) {
        return;
    }

    let point = null;
    for (const neighboring_prim of primitives) {
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
    pointsOfInterest.push(newPoi);
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
            edges.push([point, endpoint]);
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
        let path = getShortestPath(neighbor, source);
        if (path != null) {
            paths.push(path);
        }
    }

    for (const path of paths) {
        if (newRegion(path)) {
            createNewRegion(path);
        }
    }
}

//Note, this algorithm will not actually find the shortest path. It intentionally avoids paths that are 1 hop away from dest.
function getShortestPath(source, dest) {
    let Q = [];

    let visited = [];
    let dist = [];
    let prev = [];
    let ids = [];

    for (const point of pointsOfInterest) {
        visited[point.id] = false;
        dist[point.id] = Infinity;
        prev[point.id] = null;
        ids[point.id] = point;
    }

    visited[source.id] = true;
    dist[source.id] = 0;
    Q.push(source);

    let found = false;

    while (Q.length !== 0 && !found) {
        let u = Q.shift();
        for (const neighbor of u.neighbors) {
            if (!visited[neighbor.id]) {
                if (!(neighbor === dest && u === source)) {
                    visited[neighbor.id] = true;
                    dist[neighbor.id] = dist[u.id] + 1;
                    prev[neighbor.id] = u.id;
                    Q.push(neighbor);
                    if (neighbor === dest) {
                        found = true;
                        break;
                    }
                }
            }
        }
    }

    if (!found) {
        return null;
    }

    let path = [];
    let crawl = dest.id;
    while (prev[crawl] !== null) {
        path.push(ids[crawl]);
        crawl = prev[crawl];
    }
    if (path.length === 3) {
    }
    path.push(source);
    return path;
}

function newRegion(path) {
    let found = false;
    for (const region of regions) {
        if (region.path.length === path.length) {
            if (JSON.stringify(sortPath(region.path)) === JSON.stringify(sortPath(path))) {
                found = true;
            }
        }
    }
    return !found;
}

function sortPath(path) {
    let sorted_path = path.slice();
    sorted_path.sort(function (a, b) {
        return a.id - b.id;
    });
    return sorted_path;
}

function createNewRegion(region){
    let region_object = new Region(region);
    regions.push(region_object);
    console.log(region_object);
    region_object.render();
}

function deletePrimitive(primitive) {
    let pointsToDelete = new Set();
    let regionsToDelete = new Set();
    let includedPoints = new Set();
    let poisToUpdate = new Set();
    let edgesToDelete = new Set();

    for (const point of pointsOfInterest) {
        if (point.primitives.has(primitive) && point.primitives.size <= 2) {
            includedPoints.add(point);
            pointsToDelete.add(point);
        } else if (point.primitives.has(primitive)) {
            includedPoints.add(point);
            point.primitives.delete(primitive);
        }
    }

    for (const region of regions) {
        for (const point of includedPoints) {
            if (region.path.includes(point)) {
                for (const affectedPoint of region.path) {
                    if (!pointsToDelete.has(affectedPoint)) {
                        poisToUpdate.add(affectedPoint);
                    }
                }
                regionsToDelete.add(region);
            }
        }
    }

    for (const edge of edges) {
        for (const point in includedPoints) {
            if (edge[0] === point || edge[1] === point) {
                edgesToDelete.add(edge);
            }
        }
    }

    for (const edge of edgesToDelete) {
        edges = edges.filter(item => item !== edge);
    }

    for (const point of pointsToDelete) {
        pointsOfInterest = pointsOfInterest.filter(item => item !== point);
    }

    for (const region of regionsToDelete) {
        regions = regions.filter(item => item !== region);
        region.destroy();
    }

    primitive.destroy();
    primitives = primitives.filter(item => item !== primitive);

    for (const point of poisToUpdate) {
        point.neighbors.clear();
    }

    for (const point of poisToUpdate) {
        updateRegions(point);
    }
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