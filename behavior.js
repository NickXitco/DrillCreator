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

/*
let keyframes = [];

let key = {function: KeyframeFunctions.set_x, object: activeDrawing, value: 400, time: 0};
key.function(key.value, key.object);
*/

let panZoomCanvas = svgPanZoom('#svgMain', {panEnabled: false, beforePan: panCheck, controlIconsEnabled: false, minZoom: 1, dblClickZoomEnabled: false, });
panZoomCanvas.zoom(2);
panZoomCanvas.center();




//TEST DRIVER
let vertices = [];
let hedges = [];

let globalFace = new Face(null, null);


let v1 = new Vertex(200, 200);
let v2 = new Vertex(400, 300);
let v3 = new Vertex(600, 200);
let v4 = new Vertex(400, 50);
vertices.push(v1);
vertices.push(v2);
vertices.push(v3);
vertices.push(v4);

HalfEdge.addEdge(v2, v1, hedges);
HalfEdge.addEdge(v2, v3, hedges);
HalfEdge.addEdge(v4, v2, hedges);
HalfEdge.addEdge(v4, v3, hedges);



console.table(vertices);
console.table(hedges);

let faces = [];

for (const hedge of hedges) {
    if (!faces.includes(hedge.face)) {
        faces.push(hedge.face);
    }
}

console.table(faces);




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
        drawUp(x, y, activeDrawing, lines);
        activeDrawing.drawing = null;
        activeDrawing.type = null;
    } else if (e.button === 0 && currentTool === tools.SELECT) {
        selectUp(bools, selection, lines);
    } else if (e.button === 1) {
        panZoomCanvas.disablePan();
    }
    canvasDiv.style.cursor = "default";
};

/*
Use this function if for some reason in the future we want to implement edge panning.

document.onmousemove = function(e) {
    if (!e.path.includes(canvasDiv)) {
        //Not in Canvas;
    } else {
        //In Canvas
    }
};
*/

document.onmouseup = function(e) {
    if (!e.path.includes(canvasDiv)) {
        if (activeDrawing.drawing != null) {
            activeDrawing.drawing.destroy();
            activeDrawing.drawing = null;
            activeDrawing.type = null;
        }
    }
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