const electron = require('electron');
const {ipcRenderer} = electron;

const createNewButton = document.querySelector('#createNew');
createNewButton.addEventListener('click', openNewItemDialog);

function openNewItemDialog() {
    ipcRenderer.send('new:open');
}

const svgCanvas = document.querySelector('#svgMain');
const canvasDiv = document.querySelector('#canvas');

const smallGrid = document.querySelector('#smallGrid');
const gridRect = document.querySelector('#gridRect');

const g = document.querySelector('#svgG');

const gridCheckbox = document.querySelector('#gridCheckbox');

let activeLine = null;
let activeCurve = null;

let gridMultiple = 1;

let primitives = [];

let panZoomCanvas = svgPanZoom('#svgMain', {panEnabled: false, beforePan: panCheck, controlIconsEnabled: false, minZoom: 1, dblClickZoomEnabled: false, });
panZoomCanvas.zoom(2);
panZoomCanvas.center();


/* TODO Control Point Selection

 So the current plan is this:

 No more event listeners in the classes. The only reason you should have functions in the classes is if the function
 changes something INSIDE THE CLASS, called from (likely) OUTSIDE THE CLASS.
 Style changes, that shit, fine, works perfect.

 Therefore. In order to do event listeners in the sense that we want to react with these objects on the canvas scale,
 we are going to do everything in this file through mousedown, mousemove, mouseup listeners, and getting the target with
 e.

 So, here's my thinking on using control points:
    1. On click on a curve, we "select" the curve.
    2. We then generate the control point, or make it visible at least.
    3. We then listen for the mouse down on/in that control point AND ONLY that control point (through IDs or something)
       and then do the same thing we've been doing.
 */


svgCanvas.onmousedown = function(e){
    let {x, y} = virtualRoundedXY(e);

    if (e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        //left click
        let id = Util.emptySlot(primitives);
        if (currentTool === tools.LINE) {
            activeLine = new Line(x, y, x, y, "red");
        } else if (currentTool === tools.CURVE) {
            activeLine = new Curve(x, y, x, y, "blue");
        }
        activeLine.render();
        primitives[id] = activeLine;
        smallGrid.setAttribute('visibility', 'visible');
    } else if (e.button === 0) {
        console.log(e.target.id);
        if  (e.target.id !== "gridRect" && e.target.id !== "svgMain") {
            console.log(e.target);
        }
    } else if (e.button === 1) {
        //middle click
        panZoomCanvas.enablePan();
    }
};

svgCanvas.onmousemove = function(e) {
    let {x, y} = virtualRoundedXY(e);
    if (activeLine != null && e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        activeLine.updateEndpoint(x, y);
        if (activeLine instanceof Curve) {
            // TODO This is dangerous. We may not want this, because if we use this function to move
            // TODO a set curve, then it'll be resetting the possibly set control point?
            activeLine.resetControlPoint();
        }
    } else if (activeCurve != null) {
        activeCurve.updateControlPoint(x, y);
    }
};

svgCanvas.onmouseup = function(e) {
    let {x, y} = virtualRoundedXY(e);
    if (activeLine != null && e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        activeLine.updateEndpoint(x, y);
        activeLine = null;
        smallGrid.setAttribute('visibility', 'hidden');
        //TODO if line length = 0 (x1 = x2, y1= y2), destroy object.
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

// noinspection JSUnusedLocalSymbols
function gridCheckboxClick() {
    if (gridCheckbox.checked === true) {
        gridRect.setAttribute('visibility', 'visible');
        gridMultiple = 10;
    } else {
        gridRect.setAttribute('visibility', 'hidden');
        gridMultiple = 1;
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