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

let movingAnchor = false;
let movingEndpointAnchor = false;

let gridMultiple = 1;

let primitives = [];

let panZoomCanvas = svgPanZoom('#svgMain', {panEnabled: false, beforePan: panCheck, controlIconsEnabled: false, minZoom: 1, dblClickZoomEnabled: false, });
panZoomCanvas.zoom(2);
panZoomCanvas.center();


/*WE WILL need to eventually distinguish primitives from objects, probably based on editing mode.*/

svgCanvas.onmousedown = function(e){
    let {x, y} = virtualRoundedXY(e);

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
    if (activeDrawing != null && e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        drawMove(x, y);
    } else if (currentTool === tools.SELECT) {
        selectMove(x, y);
    }

};

svgCanvas.onmouseup = function(e) {
    let {x, y} = virtualRoundedXY(e);
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
    if (selectedLine !== primitives[parseInt(e.target.id)]) {
        if (selectedLine != null) {
            deselectPrimitive();
        }
        selectedLine = primitives[parseInt(e.target.id)];
        selectedLine.highlightOn();
        selectedLine.showAnchors();
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
        selectedLine.hideAnchors();
        selectedLine = null;
    }
    updatePropertyFields(selectedLine);
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
        console.log(downX + ", " + downY);
        movingPrimitive = true;
    } else if (selectedLine != null) {
        deselectPrimitive();
    }
}

function selectMove(x, y) {
    if (movingControlPoint) {
        selectedLine.updateControlPoint(x, y);
    } else if (movingAnchor) {
        selectedLine.updateAnchor(x, y);
    } else if (movingEndpointAnchor) {
        selectedLine.updateEndpoint(x, y);
    } else if (movingPrimitive) {
        selectedLine.selectShift(x - downX, y - downY);
        downX = x;
        downY = y;
    }
    updatePropertyFields(selectedLine);
}

function selectUp(x, y) {
    if (movingControlPoint) {
        selectedLine.updateControlPoint(x, y);
        movingControlPoint = false;
    } else if (movingAnchor) {
        movingAnchor = false;
    } else if (movingEndpointAnchor) {
        movingEndpointAnchor = false;
    }
    movingPrimitive = false;
}

function drawDown(x, y) {
    if (currentTool === tools.LINE) {
        activeDrawing = new Line(x, y, x, y, "red");
    } else if (currentTool === tools.CURVE) {
        activeDrawing = new Curve(x, y, x, y, "blue");
    }
    activeDrawing.render();
    activeDrawing.renderAnchors();
    smallGrid.setAttribute('visibility', 'visible');
}

function drawMove(x, y) {
    activeDrawing.updateEndpoint(x, y);
    if (activeDrawing instanceof Curve) {
        activeDrawing.resetControlPoint(); //While drawing a curve we want to keep the control point in the center of the line
    }
}

function drawUp(x, y) {
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
    activeDrawing.hideAnchors();
    activeDrawing = null;
    smallGrid.setAttribute('visibility', 'hidden');
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

