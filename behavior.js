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
let controlPoint = null;
let movingControlPoint = false;

let anchorX = null;
let anchorY = null;
let endpointX  = null;
let endpointY = null;
let controlPointX= null;
let controlPointY = null;

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

function round(num) {
    if (num % gridMultiple === 0) {
        return num
    } else if (num % gridMultiple < gridMultiple/2) {
        return num - (num % gridMultiple);
    } else {
        return num + (gridMultiple - num % gridMultiple);
    }
}

function objectEntered(e, element) {
    if (enableErasing) {
        g.removeChild(element);
        element = null;
    }
}

function objectClick(e, element) {
    activeObject = element;
    element.setAttribute('style', "stroke:rgb(0,255,0);stroke-width:2");
    updateProperties();
}

function controlPointDown(e, element, path) {

    element.setAttribute('style', "stroke:purple;stroke-width:1;fill:purple;fill-opacity: 0.5");
    movingControlPoint = true;
    controlPoint = element;
    activeLine = path;
    activeLine.setAttribute('stroke', "green");
}

function controlPointMouseOn(e, element) {
    if (!movingControlPoint) {
        element.setAttribute('style', "stroke:purple;stroke-width:1;fill:purple;fill-opacity: 0.1");
    }
}

function controlPointMouseOff(e, element) {
    if (!movingControlPoint) {
        element.setAttribute('style', "stroke:purple;stroke-width:1;fill:purple;fill-opacity: 0");
    }
}


svgCanvas.onmousedown = function(e){
    let virtualXY = getSvgPoint(e.offsetX, e.offsetY);
    if (e.button === 0 && (enableDrawing || enableCurves)) {
        //left click
        let element;
        if (enableDrawing) {
            element = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            element.setAttribute('x1', round(virtualXY.x));
            element.setAttribute('y1', round(virtualXY.y));
            element.setAttribute('x2', round(virtualXY.x));
            element.setAttribute('y2', round(virtualXY.y));
            element.setAttribute('style', "stroke:rgb(255,0,0);stroke-width:2");
        } else if (enableCurves) {
            element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            anchorX = round(virtualXY.x);
            anchorY = round(virtualXY.y);
            element.setAttribute('d', "M " + anchorX + " " + anchorY);
            element.setAttribute('stroke', "blue");
            element.setAttribute('fill', "none");

            const cp = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            cp.setAttribute('r', "" + 5);
            cp.setAttribute('style', "stroke:purple;stroke-width:1;fill:purple;fill-opacity: 0");
            controlPoint = cp;
            g.appendChild(cp);
            cp.addEventListener("mousedown", function (e) {
                controlPointDown(e, cp, element);
            });
            cp.addEventListener("mouseenter", function (e) {
                controlPointMouseOn(e, cp);
            });
            cp.addEventListener("mouseout", function (e) {
                controlPointMouseOff(e, cp);
            });
        }
        activeLine = element;
        activeObject = activeLine;
        updateProperties();
        g.appendChild(element);
        element.addEventListener("mouseenter", function (e) {
            objectEntered(e, element);
        });
        element.addEventListener("click", function (e) {
            objectClick(e, element);
        });
        smallGrid.setAttribute('visibility', 'visible');
    } else if (e.button === 1) {
        //middle click
        panZoomCanvas.enablePan();
    }
};

svgCanvas.onmousemove = function(e) {
    let virtualXY = getSvgPoint(e.offsetX, e.offsetY);

    if (movingControlPoint) {
        controlPointX = round(virtualXY.x);
        controlPointY = round(virtualXY.y);

        controlPoint.setAttribute('cx', controlPointX);
        controlPoint.setAttribute('cy', controlPointY);

        activeLine.setAttribute('d', "M" + anchorX + " " + anchorY + " Q" + controlPointX + " " + controlPointY + " " + endpointX + " " + endpointY);

    } else if (activeLine != null && e.button === 0 && (enableDrawing || enableCurves)) {
        updateProperties();
        if (enableDrawing) {
            activeLine.setAttributeNS(null, 'x2', round(virtualXY.x));
            activeLine.setAttributeNS(null, 'y2', round(virtualXY.y));
        } else if (enableCurves) {
            endpointX = round(virtualXY.x);
            endpointY = round(virtualXY.y);

            controlPointX = (anchorX + endpointX)/2;
            controlPointY = (anchorY + endpointY)/2;

            controlPoint.setAttribute('cx', controlPointX);
            controlPoint.setAttribute('cy', controlPointY);

            activeLine.setAttribute('d', "M" + anchorX + " " + anchorY + " Q" + controlPointX + " " + controlPointY + " " + endpointX + " " + endpointY);
        }
    }
};

svgCanvas.onmouseup = function(e) {
    let virtualXY = getSvgPoint(e.offsetX, e.offsetY);
    if (movingControlPoint) {
        controlPoint.setAttribute('cx', round(virtualXY.x));
        controlPoint.setAttribute('cy', round(virtualXY.y));

        activeLine.setAttribute('d', "M" + anchorX + " " + anchorY + " Q" + controlPointX + " " + controlPointY + " " + endpointX + " " + endpointY);

        activeLine = null;
        movingControlPoint = false;
        controlPoint.setAttribute('style', "stroke:purple;stroke-width:1;fill:purple;fill-opacity: 0");
    } else if (activeLine != null && e.button === 0 && (enableDrawing || enableCurves)) {
        if (enableDrawing) {
            activeLine.setAttributeNS(null, 'x2', round(virtualXY.x));
            activeLine.setAttributeNS(null, 'y2', round(virtualXY.y));
        } else if (enableCurves) {
            endpointX = round(virtualXY.x);
            endpointY = round(virtualXY.y);

            controlPointX = (anchorX + endpointX)/2;
            controlPointY = (anchorY + endpointY)/2;

            controlPoint.setAttribute('cx', controlPointX);
            controlPoint.setAttribute('cy', controlPointY);

            activeLine.setAttribute('d', "M" + anchorX + " " + anchorY + " Q" + controlPointX + " " + controlPointY + " " + endpointX + " " + endpointY);
        }
        activeLine = null;
        updateProperties();
        smallGrid.setAttribute('visibility', 'hidden');
    } else if (e.button === 1) {
        panZoomCanvas.disablePan();
    }
};


/**
 * Transforms 'regular' coordinates into virtual SVG coordinates.
 * Beware, svgCanvas and g are hardcoded in.
 * This may cause issues in a future situation I'm not currently forseeing (as of 5/26/19).
 * If it is an issue, I'd imagine you could pass both the SVG and the G in as parameters and be no big deal.
 * @param x "Real" Screen X coordinate
 * @param y "Real" Screen Y coordinate
 * @returns svgDropPoint a DOM with a "Virtual" SVG X and Y attached.
 */
function getSvgPoint(x, y) {
    let svgDropPoint = svgCanvas.createSVGPoint();

    svgDropPoint.x = x;
    svgDropPoint.y = y;

    svgDropPoint = svgDropPoint.matrixTransform(g.getCTM().inverse());
    return svgDropPoint;
}



ipcRenderer.on('item:add', function(){
    //New Item
    const element = document.createElementNS('http://www.w3.org/2000/svg', "circle");
    element.textContent = 'Hello World!';
    element.setAttribute('cx', '1000');
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