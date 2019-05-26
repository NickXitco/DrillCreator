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

const drawings = [];

let activeObject = null;
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