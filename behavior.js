const electron = require('electron');
const {ipcRenderer} = electron;

const createNewButton = document.querySelector('#createNew');
createNewButton.addEventListener('click', openNewItemDialog);

function openNewItemDialog() {
    ipcRenderer.send('new:open');
}

const svgCanvas = document.querySelector('#svgMain');
const canvasDiv = document.querySelector('#canvas');

const stopButton = document.querySelector('#stopbtn');
const playButton = document.querySelector('#playbtn');
const stepForwardButton = document.querySelector('#stepfbtn');
const stepBackButton = document.querySelector('#stepbbtn');

const label = document.querySelector('#label');
const activeX1 = document.querySelector('#activeX1');
const activeY1 = document.querySelector('#activeY1');
const activeX2 = document.querySelector('#activeX2');
const activeY2 = document.querySelector('#activeY2');
const activeWidth = document.querySelector('#activeWidth');
const activeHeight = document.querySelector('#activeHeight');

const smallGrid = document.querySelector('#smallGrid');
const gridRect = document.querySelector('#gridRect');

const g = document.querySelector('#svgG');

const gridCheckbox = document.querySelector('#gridCheckbox');
const drawLineCheckbox = document.querySelector('#drawLineCheckbox');
const eraseLineCheckbox = document.querySelector('#eraseLineCheckbox');
const curveCheckbox = document.querySelector('#curveToolCheckbox');


const drawings = [];

let activeObject = null;
let activeLine = null;

let play = true;

let enableErasing = false;
let enableDrawing = false;
let enableCurves = false;

let gridMultiple = 1;

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

/*
let i = setInterval(function () {
    if (play) {
        step();
        //if ENDSTATE: clearInterval(i)
    }
}, 16.7);
*/

function updateProperties() {
    if (activeObject != null) {
        if (activeObject.textContent != null) {
            label.innerText = "Label: " + activeObject.textContent;
        }
        activeX1.value = "X1: " + activeObject.getAttribute('x1');
        activeY1.value = "Y1: " + activeObject.getAttribute('y1');
        activeX2.value = "X2: " + activeObject.getAttribute('x2');
        activeY2.value = "Y2: " + activeObject.getAttribute('y2');
        activeWidth.value = "Width: " + activeObject.getAttribute('activeWidth');
        activeHeight.value = "Height: " + activeObject.getAttribute('activeHeight');
    }
}

function step() {
    updateProperties();
    drawings.forEach(function(object){
        const x = parseFloat(object.svg.getAttributeNS(null, 'x'));
        const y = parseFloat(object.svg.getAttributeNS(null, 'y'));
        const width = object.svg.getBBox().width;
        const height = object.svg.getBBox().height;

        if (x + object.xVel >= canvasDiv.offsetWidth - width || x + object.xVel <= 0) {
            object.xVel *= -1;
        }
        if (y + object.yVel >= canvasDiv.offsetHeight || y + object.yVel <= height/2) {
            object.yVel *= -1;
        }

        object.svg.setAttributeNS(null, 'x', x + object.xVel);
        object.svg.setAttributeNS(null, 'y', y + object.yVel);
    })
}

stopButton.onclick = function(){play = false;};
playButton.onclick = function(){play = true;};

stepBackButton.onclick = function(){
    if (!play) {
        drawings.forEach(function(object){
            object.xVel *= -1;
            object.yVel *= -1;
        });
        step();
        drawings.forEach(function(object){
            object.xVel *= -1;
            object.yVel *= -1;
        });
    }
};

stepForwardButton.onclick = function(){
    if (!play) {
        step();
    }
};

// noinspection JSUnusedLocalSymbols
function drawLineCheckboxClick() {
    if (drawLineCheckbox.checked === true) {
        eraseLineCheckbox.checked = false;
        enableErasing = false;
        enableDrawing = true;
    } else {
        enableDrawing = false;
    }
}

// noinspection JSUnusedLocalSymbols
function eraseLineCheckboxClick() {
    if (eraseLineCheckbox.checked === true) {
        drawLineCheckbox.checked = false;
        enableErasing = true;
        enableDrawing = false;
    } else {
        enableErasing = false;
    }
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

// noinspection JSUnusedLocalSymbols
function selectToolCheckboxClick() {
    
}

// noinspection JSUnusedLocalSymbols
function curveToolCheckboxClick() {
    if(curveCheckbox.checked === true) {
        drawLineCheckbox.checked = false;
        enableDrawing = false;
        eraseLineCheckbox.checked = false;
        enableErasing = false;
        enableCurves = true;
    }
    else {
        enableCurves = false
    }
}


svgCanvas.onmousedown = function(e){
    let virtualXY = getSvgPoint(e.offsetX, e.offsetY, svgCanvas, g);
    let x = round(virtualXY.x, gridMultiple);
    let y = round(virtualXY.y, gridMultiple);

    if (e.button === 0 && enableDrawing) {
        //left click
        activeLine = new Line(x, y, x, y, "red");
        activeObject = activeLine;
        //updateProperties();
        smallGrid.setAttribute('visibility', 'visible');
    } else if (e.button === 0 && enableCurves) {
        activeLine = new Curve(x, y, x, y, "blue");
    } else if (e.button === 1) {
        //middle click
        panZoomCanvas.enablePan();
    }
};

svgCanvas.onmousemove = function(e) {
    let virtualXY = getSvgPoint(e.offsetX, e.offsetY, svgCanvas, g);
    let x = round(virtualXY.x, gridMultiple);
    let y = round(virtualXY.y, gridMultiple);
    if (activeLine != null && e.button === 0 && (enableDrawing || enableCurves)) {
        //updateProperties();
        activeLine.updateEndpoint(x, y);
        if (activeLine instanceof Curve) {
            // TODO This is dangerous. We may not want this, because if we use this function to move
            // TODO a set curve, then it'll be resetting the possibly set control point?
            activeLine.resetControlPoint();
        }
    }
};

svgCanvas.onmouseup = function(e) {
    let virtualXY = getSvgPoint(e.offsetX, e.offsetY, svgCanvas, g);
    let x = round(virtualXY.x, gridMultiple);
    let y = round(virtualXY.y, gridMultiple);
    if (activeLine != null && e.button === 0 && (enableDrawing || enableCurves)) {
        activeLine.updateEndpoint(x, y);
        activeLine = null;
        //updateProperties();
        smallGrid.setAttribute('visibility', 'hidden');
    } else if (e.button === 1) {
        panZoomCanvas.disablePan();
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

/*
// Clear items
ipcRenderer.on('item:clear', function(){
    ul.innerHTML = '';
    ul.className = '';
});
*/









// TODO REFACTOR THESE PLEASE FOR THE LOVE OF GOD

function round(num, gridMultiple) {
    if (num % gridMultiple === 0) {
        return num
    } else if (num % gridMultiple < gridMultiple/2) {
        return num - (num % gridMultiple);
    } else {
        return num + (gridMultiple - num % gridMultiple);
    }
}

/**
 * Transforms 'regular' coordinates into virtual SVG coordinates.
 * @param x "Real" Screen X coordinate
 * @param y "Real" Screen Y coordinate
 * @param svgCanvas Canvas to manipulate point on
 * @param g SVG G object containing the transformation
 * @returns svgDropPoint a DOM with a "Virtual" SVG X and Y attached.
 */
function getSvgPoint(x, y, svgCanvas, g) {
    let svgDropPoint = svgCanvas.createSVGPoint();

    svgDropPoint.x = x;
    svgDropPoint.y = y;

    svgDropPoint = svgDropPoint.matrixTransform(g.getCTM().inverse());
    return svgDropPoint;
}