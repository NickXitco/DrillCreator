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
let selectedLine = null;
let movingControlPoint = false;
let movingPrimitive = false;

let gridMultiple = 1;

let primitives = [];

let panZoomCanvas = svgPanZoom('#svgMain', {panEnabled: false, beforePan: panCheck, controlIconsEnabled: false, minZoom: 1, dblClickZoomEnabled: false, });
panZoomCanvas.zoom(2);
panZoomCanvas.center();


/*WE WILL need to eventually distinguish primitives from objects, probably based on editing mode.*/

svgCanvas.onmousedown = function(e){
    let {x, y} = virtualRoundedXY(e);

    if (e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        //left click
        if (currentTool === tools.LINE) {
            activeDrawing = new Line(x, y, x, y, "red");
        } else if (currentTool === tools.CURVE) {
            activeDrawing = new Curve(x, y, x, y, "blue");
        }
        activeDrawing.render();
        smallGrid.setAttribute('visibility', 'visible');
    } else if (e.button === 0 && (currentTool === tools.SELECT)) {
        if (e.target.id === "activeControlPoint") {
            movingControlPoint = true;
        } else if (e.target.id !== "gridRect" && e.target.id !== "svgMain") {
            selectPrimitive(e);
            downX = x;
            downY = y;
            console.log(downX + ", " + downY);
            movingPrimitive = true;
        } else if (selectedLine != null) {
            deselectPrimitive();
        }
    } else if (e.button === 1) {
        //middle click
        panZoomCanvas.enablePan();
    }
};

svgCanvas.onmousemove = function(e) {
    let {x, y} = virtualRoundedXY(e);
    if (activeDrawing != null && e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        activeDrawing.updateEndpoint(x, y);
        if (activeDrawing instanceof Curve) {
            activeDrawing.resetControlPoint(); //While drawing a curve we want to keep the control point in the center of the line
        }
    } else if (currentTool === tools.SELECT) {
        if (movingControlPoint) {
            selectedLine.updateControlPoint(x, y);
        }
        if (movingPrimitive) {
            selectedLine.selectShift(x - downX, y - downY);
            downX = x;
            downY = y;
        }
        updatePropertyFields(selectedLine);
    }

};

svgCanvas.onmouseup = function(e) {
    let {x, y} = virtualRoundedXY(e);
    if (activeDrawing != null && e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        activeDrawing.updateEndpoint(x, y);
        if (activeDrawing.getLength() < 5) {
            activeDrawing.destroy(); //Destroy lines that are too short
        } else {
            let id = Util.emptySlot(primitives);
            activeDrawing.setID(id);
            primitives[id] = activeDrawing;
        }

        if (activeDrawing instanceof Curve) {
            activeDrawing.hideControlPoint();
        }
        activeDrawing = null;
        smallGrid.setAttribute('visibility', 'hidden');
    } else if (e.button === 0 && currentTool === tools.SELECT) {
        if (movingControlPoint) {
            selectedLine.updateControlPoint(x, y);
            movingControlPoint = false;
        }
        movingPrimitive = false;
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

function selectPrimitive(e) {
    if (selectedLine !== primitives[parseInt(e.target.id)]) {
        if (selectedLine != null) {
            deselectPrimitive();
        }
        selectedLine = primitives[parseInt(e.target.id)];
        selectedLine.highlightOn();
        if (selectedLine instanceof Curve) {
            selectedLine.setActiveControlPoint();
        }
    }
    updatePropertyFields(selectedLine);
}

function deselectPrimitive() {
    if (selectedLine != null) {
        if (selectedLine instanceof Curve) {
            selectedLine.hideControlPoint();
        }
        selectedLine.highlightOff();
        selectedLine = null;
    }
    updatePropertyFields(selectedLine);
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

