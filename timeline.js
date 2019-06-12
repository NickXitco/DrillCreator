const playhead = document.querySelector('#playhead');
const timeline = document.querySelector('#timeline');
const pattern = document.querySelector('#tlSmallHashes');


let dragging = false;


playhead.onmousedown = function () {
    dragging = true;
};

timeline.onmousemove = function (e){
    if (dragging === true) {
        playhead.setAttribute('d', "M" + e.offsetX +  " 10 l -5 -5 v -5 h 10 v 5 l -5 5 v 40")
    }
};

playhead.onmouseup = function () {
    dragging = false;
};

