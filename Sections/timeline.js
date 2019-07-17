let playhead_dragging = false;
let zoomFactor = 0; //This could be a confusing variable but what I'm thinking is 0 for still, 1 for the right, -1 for the left? we'll see, could be dumb
let panning = false;
let pzcs_downX; //pan zoom control surface
let playhead_downX;


const baselineZoom = 4;

let timelineLength = 900;
let timelineZoom = baselineZoom;
let scrollbarLeft = 0;
let scrollbarRight = timeline.clientWidth / timelineZoom;
let scrollbarLength = scrollbarRight - scrollbarLeft;

let playhead_position = 160;

rightPanZoomHandle.setAttribute('cx', scrollbarRight);
barPanZoom.setAttribute('x2', scrollbarRight);
setPatternPosition();
setPlayheadPosition();

function setPatternPosition() {
    pattern.setAttribute('patternTransform', "scale("+ timelineZoom * (timeline.clientWidth / timelineLength) + ", 1) translate(" + -scrollbarLeft * (timelineLength / timeline.clientWidth) + ")");

}

function setPlayheadPosition() {
    playhead.setAttribute('d', "M" + (playhead_position * (timelineZoom * (timeline.clientWidth / timelineLength)) - (scrollbarLeft * timelineZoom))  +  " 10 l -5 -5 v -5 h 10 v 5 l -5 5 v 40");

}

playhead.onmousedown = function (e) {
    playhead_dragging = true;
    playhead_downX = e.offsetX;
};

timeline.onmousemove = function (e){
    if (playhead_dragging === true) {
        playhead_position += (e.offsetX - playhead_downX) / (timelineZoom * (timeline.clientWidth / timelineLength));
        playhead_downX = e.offsetX;
        setPlayheadPosition();
    }
};


playhead.onmouseup = function () {
    playhead_dragging = false;
};


rightPanZoomHandle.onmousedown = function (e) {
    pzcs_downX = e.offsetX;
    zoomFactor = 1;
};

leftPanZoomHandle.onmousedown = function (e) {
    pzcs_downX = e.offsetX;
    zoomFactor = -1;
};


timelineDiv.onmousemove = function (e) {
    if (zoomFactor !== 0) {
        zoomPZCS((e.offsetX - pzcs_downX) * zoomFactor);
        pzcs_downX = e.offsetX;
    } else if (panning === true) {
        shiftPZCS(e.offsetX - pzcs_downX);
        pzcs_downX = e.offsetX;
    }
};


barPanZoom.onmousedown = function(e) {
    pzcs_downX = e.offsetX;
    panning = true;
};

document.onmouseup = function () {
    stopZoom();
    stopPan();
    playhead_dragging = false;
};

panZoomControlSurface.onmouseup = function () {
    stopZoom();
    stopPan();
};


function stopZoom() {
    zoomFactor = 0;
}


function stopPan() {
    panning = false;
}


function zoomPZCS(x) {
    if (scrollbarLength + 2*x > 20) {
        if (parseInt(leftPanZoomHandle.getAttribute('cx')) - x >= 0) {
            leftPanZoomHandle.setAttribute('cx', (parseInt(leftPanZoomHandle.getAttribute('cx')) - x).toString());
            barPanZoom.setAttribute('x1', (parseInt(barPanZoom.getAttribute('x1')) -  x).toString());
            scrollbarLeft -= x;
        }
        if (parseInt(rightPanZoomHandle.getAttribute('cx')) + x <= timeline.clientWidth) {
            rightPanZoomHandle.setAttribute('cx', parseInt(rightPanZoomHandle.getAttribute('cx')) + x);
            barPanZoom.setAttribute('x2', parseInt(barPanZoom.getAttribute('x2')) + x);
            scrollbarRight += x;
        }
        scrollbarLength = scrollbarRight - scrollbarLeft;
        timelineZoom = timeline.clientWidth/scrollbarLength;
        setPatternPosition();
        setPlayheadPosition()
    }
}

function shiftPZCS(x) {
    if (parseInt(leftPanZoomHandle.getAttribute('cx')) + x >= 0 && parseInt(rightPanZoomHandle.getAttribute('cx')) + x <= (timeline.clientWidth)) {
        rightPanZoomHandle.setAttribute('cx', parseInt(rightPanZoomHandle.getAttribute('cx')) + x);
        leftPanZoomHandle.setAttribute('cx', parseInt(leftPanZoomHandle.getAttribute('cx')) + x);
        barPanZoom.setAttribute('x1', parseInt(barPanZoom.getAttribute('x1')) + x);
        barPanZoom.setAttribute('x2', parseInt(barPanZoom.getAttribute('x2')) + x);
        scrollbarLeft += x;
        scrollbarRight += x;
        setPlayheadPosition();
        setPatternPosition();
    }
}