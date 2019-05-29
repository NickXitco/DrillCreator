const electron = require('electron');
const {ipcRenderer} = electron;

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

const drawings = [];

let activeObject = null;
let activeLine = null;
let play = true;
let enableErasing = false;
let enableDrawing = false;

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

function drawLineCheckboxClick() {
    if (drawLineCheckbox.checked === true) {
        eraseLineCheckbox.checked = false;
        enableErasing = false;
        enableDrawing = true;
    } else {
        enableDrawing = false;
    }
}

function eraseLineCheckboxClick() {
    if (eraseLineCheckbox.checked === true) {
        drawLineCheckbox.checked = false;
        enableErasing = true;
        enableDrawing = false;
    } else {
        enableErasing = false;
    }
}

function gridCheckboxClick() {
    if (gridCheckbox.checked === true) {
        gridRect.setAttribute('visibility', 'visible');
        gridMultiple = 10;
    } else {
        gridRect.setAttribute('visibility', 'hidden');
        gridMultiple = 1;
    }
}

function objClick(object){
    activeObject = object;
    updateProperties();
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

svgCanvas.onmousedown = function(e){
    let virtualXY = getSvgPoint(e.offsetX, e.offsetY);
    if (e.button === 0 && enableDrawing) {
        //left click
        const element = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        element.setAttributeNS(null, 'x1', round(virtualXY.x));
        element.setAttributeNS(null, 'y1', round(virtualXY.y));
        element.setAttributeNS(null, 'x2', round(virtualXY.x));
        element.setAttributeNS(null, 'y2', round(virtualXY.y));
        element.setAttributeNS(null, 'style', "stroke:rgb(255,0,0);stroke-width:2");
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
    if (activeLine != null && e.button === 0 && enableDrawing) {
        updateProperties();
        activeLine.setAttributeNS(null, 'x2', round(virtualXY.x));
        activeLine.setAttributeNS(null, 'y2', round(virtualXY.y));
    }
};

svgCanvas.onmouseup = function(e) {
    let virtualXY = getSvgPoint(e.offsetX, e.offsetY);
    if (activeLine != null && e.button === 0 && enableDrawing) {
        activeLine.setAttributeNS(null, 'x2', round(virtualXY.x));
        activeLine.setAttributeNS(null, 'y2', round(virtualXY.y));
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
 * If it is an issue, I'd imagine you could pass both the SVG and the G in as paramters and be no big deal.
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

ipcRenderer.on('item:add', function(e, item){
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    element.setAttributeNS(null, 'x', "" + 500);
    element.setAttributeNS(null, 'y', "" + 150);
    const txt = document.createTextNode(item);
    element.appendChild(txt);
    g.appendChild(element);
    let object = {
        svg: element,
        xVel: 2,
        yVel: 2,
        x: element.getAttributeNS(null, 'x'),
        y: element.getAttributeNS(null, 'y')
    };
    element.addEventListener("click", function(){
        objClick(object);
    });
    drawings.push(object);
});

/*
// Clear items
ipcRenderer.on('item:clear', function(){
    ul.innerHTML = '';
    ul.className = '';
});
*/