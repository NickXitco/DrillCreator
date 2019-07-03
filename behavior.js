const electron = require('electron');
const {ipcRenderer} = electron;


const createNewButton = document.querySelector('#createNew');
createNewButton.addEventListener('click', openNewItemDialog);

function openNewItemDialog() {
    ipcRenderer.send('new:open');
}

let down = {x: null, y: null};

let activeDrawing = {drawing: null, type: null};
let bools = {movingSelection: false, multiSelecting: false};
let multiSelectRect = createMultiSelectRect();
let selection = {rect: multiSelectRect, primitives: []};

let gridMultiple = 1;

let lines = [];
let pointsOfInterest = new Set();
let poiIDCounter = 0;
let edges = new Set();


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
        drawDown(x, y, activeDrawing, lines);
    } else if (e.button === 0 && (currentTool === tools.SELECT)) {
        selectDown(e, x, y, down, bools, selection);
    } else if (e.button === 1) {
        //middle click
        panZoomCanvas.enablePan();
    }
};

svgCanvas.onmousemove = function(e) {
    let {x, y} = Util.virtualRoundedXY(e, svgCanvas, g, gridMultiple);
    x = parseInt(x);
    y = parseInt(y);
    if (activeDrawing.drawing != null && e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        drawMove(x, y, activeDrawing, lines);
    } else if (currentTool === tools.SELECT) {
        if (selection.primitives.length === 0 && bools.multiSelecting) {
            moveMultiSelectRect(x, y, down, selection);
        } else if (bools.movingSelection){
            selectMove(x, y, down, selection, lines);
        } else {
            updateMouseFields(x, y);
        }
    }
};

svgCanvas.onmouseup = function(e) {
    let {x, y} = Util.virtualRoundedXY(e, svgCanvas, g, gridMultiple);
    x = parseInt(x);
    y = parseInt(y);
    if (activeDrawing.drawing != null && e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        drawUp(x, y, activeDrawing, lines);
        let anchorPOI = createNewPOI(activeDrawing.drawing.anchor);
        let endpointPOI = createNewPOI(activeDrawing.drawing.endpoint);
        createNewEdge(anchorPOI, endpointPOI, activeDrawing.drawing);
        activeDrawing.drawing = null;
        activeDrawing.type = null;
    } else if (e.button === 0 && currentTool === tools.SELECT) {
        selectUp(bools, selection, lines);
        resolvePOIs(selection);
    } else if (e.button === 1) {
        panZoomCanvas.disablePan();
    }
    console.log(pointsOfInterest);
    console.log(edges);
};

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

function createMultiSelectRect() {
    let multiSelectRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    multiSelectRect.setAttribute('stroke', 'gray');
    multiSelectRect.setAttribute('fill', 'none');
    multiSelectRect.setAttribute('stroke-dasharray', '3');
    return multiSelectRect;
}

function createNewPOI(endpoint) {
    for (const point of pointsOfInterest) {
        if (point.x === endpoint.x && point.y === endpoint.y) {
            point.endpoints.add(endpoint);
            return point;
        }
    }
    let newPoi = new POI(endpoint, poiIDCounter);
    poiIDCounter++;
    pointsOfInterest.add(newPoi);
    return newPoi;
}

function createNewEdge(anchorPOI, endpointPOI, line) {
    edges.add(new Edge(anchorPOI, endpointPOI, line));
}


function getPOI(endpoint) {
    for (const point of pointsOfInterest) {
        if (point.endpoints.has(endpoint)) {
            return point;
        }
    }
    return null;
}

function mergePOIs(master, slave) {
    for (const point of slave.endpoints) {
        master.endpoints.add(point);
    }

    for (const edge of getEdges(slave)) {
        edges.delete(edge);
        if (edge.u === slave) {
            createNewEdge(master, edge.v, edge.line);
        } else if (edge.v === slave) {
            createNewEdge(edge.u, master, edge.line);
        }
    }

    pointsOfInterest.delete(slave);
}

function getEdges(poi) {
    let result = [];
    for (const edge of edges) {
        if (edge.u === poi || edge.v === poi) {
            result.push(edge);
        }
    }
    return result;
}

function getEdge(p1, p2) {
    for (const edge of edges) {
        if ((edge.u === p1 && edge.v === p2) || (edge.u === p2 && edge.v === p1)) {
            return edge;
        }
    }
    return null;
}

function separatePOI(poi, endpoint) {
    let u = poi;
    let v;
    if (endpoint.endpointClass === epClasses.ANCHOR) {
        v = getPOI(endpoint.parentLine.endpoint);
    } else {
        v = getPOI(endpoint.parentLine.anchor);
    }

    let edge = getEdge(u, v);
    edges.delete(edge);
    poi.removeEndpoint(endpoint);
    createNewEdge(createNewPOI(endpoint), v, edge.line);
}

function resolvePOIs(selection) {
    let pointsToResolve = [];
    for (const prim of selection.primitives) {
        if (prim instanceof Line) {
            let p = getPOI(prim.anchor);
            if (p !== null) {
                pointsToResolve.push({poi: p, endpoint: prim.anchor});
            }
            p = getPOI(prim.endpoint);
            if (p !== null) {
                pointsToResolve.push({poi: p, endpoint: prim.endpoint});
            }
        } else if (prim instanceof Endpoint) {
            let p = getPOI(prim);
            if (p !== null) {
                pointsToResolve.push({poi: p, endpoint: prim});
            }
        }
    }

    for (const pointObject of pointsToResolve) {
        let filter = pointsToResolve.filter(item => item.poi === pointObject.poi);
        if (filter.length === pointObject.poi.endpoints.size) {
            pointObject.poi.move(pointObject.endpoint.x, pointObject.endpoint.y);
            for (const point of pointsOfInterest) {
                if (point !== pointObject.poi && point.x === pointObject.poi.x && point.y === pointObject.poi.y) {
                    mergePOIs(point, pointObject.poi);
                }
            }
        } else {
            separatePOI(pointObject.poi, pointObject.endpoint);
        }
    }
}
