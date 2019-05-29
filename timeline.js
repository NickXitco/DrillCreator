const playhead = document.querySelector('#playhead');
const timeline = document.querySelector('#timeline');

let dragging = false;


playhead.onmousedown = function () {
    dragging = true;
};

timeline.onmousemove = function (e){
    if (dragging === true) {
        playhead.setAttribute('x1', e.offsetX);
        playhead.setAttribute('x2', e.offsetX);
    }
};

playhead.onmouseup = function () {
    dragging = false;
};

