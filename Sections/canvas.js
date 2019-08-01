const electron = require('electron');
const {ipcRenderer} = electron;

let down = {x: null, y: null};

let activeDrawing = {drawing: null, type: null};
let bools = {movingSelection: false, multiSelecting: false};
let multiSelectRect = createMultiSelectRect();
let selection = {rect: multiSelectRect, primitives: [], objects: []};

let gridMultiple = 1;

let lines = [];
let hedges = [];
let faces = [];

let objects = [];

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

canvasDiv.onmousedown = function(e){
    let {x, y} = Util.virtualRoundedXY(e, svgCanvas, g, gridMultiple);
    x = parseInt(x);
    y = parseInt(y);
    if (e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        drawDown(x, y, activeDrawing, lines);
    } else if (e.button === 0 && (currentTool === tools.SELECT)) {
        canvasDiv.style.cursor = "grabbing";
        selectDown(e, x, y, down, bools, selection);
    } else if (e.button === 1) {
        //middle click
        panZoomCanvas.enablePan();
    }
};

canvasDiv.onmousemove = function(e) {
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

canvasDiv.onmouseup = function(e) {
    let {x, y} = Util.virtualRoundedXY(e, svgCanvas, g, gridMultiple);
    x = parseInt(x);
    y = parseInt(y);
    if (activeDrawing.drawing != null && e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        drawUp(x, y, activeDrawing, lines, hedges, faces);
        activeDrawing.drawing = null;
        activeDrawing.type = null;
    } else if (e.button === 0 && currentTool === tools.SELECT) {
        selectUp(bools, selection, lines, hedges, faces);
    } else if (e.button === 1) {
        panZoomCanvas.disablePan();
    }
    canvasDiv.style.cursor = "default";
    setObjFaces()
};

document.onmouseup = function(e) {
    if (!e.path.includes(canvasDiv)) {
        if (activeDrawing.drawing != null) {
            activeDrawing.drawing.destroy();
            activeDrawing.drawing = null;
            activeDrawing.type = null;
        }
    }
};

ipcRenderer.on('item:add', function(e, payload){
    let p = Person.addPerson(payload.name, payload.picture);
    p.setFace(Util.getFace(p.x, p.y, hedges));
    objects.push(p);
});

/***
 * Temporary expensive function. Sets the face of all objects in memory.
 */
function setObjFaces() {
    for (const obj of objects) {
        obj.setFace(Util.getFace(obj.x, obj.y, hedges))
    }
}

function createMultiSelectRect() {
    let multiSelectRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    multiSelectRect.setAttribute('stroke', 'gray');
    multiSelectRect.setAttribute('fill', 'none');
    multiSelectRect.setAttribute('stroke-dasharray', '3');
    return multiSelectRect;
}