const electron = require('electron');
const {ipcRenderer} = electron;

const svgCanvas = document.querySelector('#svgMain');
const canvasDiv = document.querySelector('#canvas');

const stopButton = document.querySelector('#stopbtn');
const playButton = document.querySelector('#playbtn');
const stepForwardButton = document.querySelector('#stepfbtn');
const stepBackButton = document.querySelector('#stepbbtn');

const label = document.querySelector('#label');
const activeX = document.querySelector('#activeX');
const activeY = document.querySelector('#activeY');

const smallGrid = document.querySelector('#smallGrid');

const drawings = [];

let activeObject = null;
let activeLine = null;
let play = true;

let i = setInterval(function () {
    if (play) {
        step();
        //if ENDSTATE: clearInterval(i)
    }
}, 16.7);

function updateProperties() {
    if (activeObject != null) {
        label.innerText = "Label: " + activeObject.svg.textContent;
        activeX.innerText = "X: " + activeObject.svg.getAttributeNS(null,'x');
        activeY.innerText = "Y: " + activeObject.svg.getAttributeNS(null,'y');

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

function objClick(object){
    activeObject = object;
    updateProperties();
}

function round(num) {
    const multiple = 10; //TODO make this an enabled effect, AKA, change the multiple to like 10 or something
    if (num % multiple === 0) {
        return num
    } else if (num % multiple < multiple/2) {
        return num - (num % multiple);
    } else {
        return num + (multiple - num % multiple);
    }
}


svgCanvas.onmousedown = function(e){
    if (e.button === 0) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        element.setAttributeNS(null, 'x1', round(e.offsetX));
        element.setAttributeNS(null, 'y1', round(e.offsetY));
        element.setAttributeNS(null, 'x2', round(e.offsetX));
        element.setAttributeNS(null, 'y2', round(e.offsetY));
        element.setAttributeNS(null, 'style', "stroke:rgb(255,0,0);stroke-width:2");
        activeLine = element;
        svgCanvas.appendChild(element);
        smallGrid.setAttribute('visibility', 'visible');
    }
};

svgCanvas.onmousemove = function(e) {
    if (activeLine != null && e.button === 0) {
        activeLine.setAttributeNS(null, 'x2', round(e.offsetX));
        activeLine.setAttributeNS(null, 'y2', round(e.offsetY));
    }
};

svgCanvas.onmouseup = function(e) {
    if (activeLine != null && e.button === 0) {
        activeLine.setAttributeNS(null, 'x2', round(e.offsetX));
        activeLine.setAttributeNS(null, 'y2', round(e.offsetY));
        activeLine = null;
        smallGrid.setAttribute('visibility', 'hidden');
    }
};


ipcRenderer.on('item:add', function(e, item){
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    element.setAttributeNS(null, 'x', 500);
    element.setAttributeNS(null, 'y', 150);
    const txt = document.createTextNode(item);
    element.appendChild(txt);
    svgCanvas.appendChild(element);
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