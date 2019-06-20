let playhead_dragging = false;
let zoomFactor = 0; //This could be a confusing variable but what I'm thinking is 0 for still, 1 for the right, -1 for the left? we'll see, could be dumb
let panning = false;
let pzcs_downX; //pan zoom control surface

let timelineZoom = 1;
let timelinePosition = 0;


playhead.onmousedown = function () {
    playhead_dragging = true;
};

timeline.onmousemove = function (e){
    if (playhead_dragging === true) {
        playhead.setAttribute('d', "M" + parseInt(e.offsetX + timelinePosition) +  " 10 l -5 -5 v -5 h 10 v 5 l -5 5 v 40")
    }
};


//TODO also trigger this on timeline.onmouseup and mouseleave
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


//TODO this is probably too small a surface to be checking, consider expanding all the way up to the document scale.
panZoomControlSurface.onmousemove = function (e) {
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
    if (parseInt(leftPanZoomHandle.getAttribute('cx')) - x >= 0) {
        leftPanZoomHandle.setAttribute('cx', (parseInt(leftPanZoomHandle.getAttribute('cx')) - x).toString());
        barPanZoom.setAttribute('x1', (parseInt(barPanZoom.getAttribute('x1')) -  x).toString());
        timelineZoom -= (x/50);
    }
    if (parseInt(rightPanZoomHandle.getAttribute('cx')) + x <= timeline.clientWidth - 40) {
        rightPanZoomHandle.setAttribute('cx', parseInt(rightPanZoomHandle.getAttribute('cx')) + x);
        barPanZoom.setAttribute('x2', parseInt(barPanZoom.getAttribute('x2')) + x);
        timelineZoom -= (x/50);
    }
    //TODO cap zoom
    pattern.setAttribute('patternTransform', "scale("+ timelineZoom + ", 1) translate(" + -timelinePosition + ")");
    //TODO lock playhead to this transformation as well..... somehow
    //playheads horizontal movement should be correlated to the zoom factor in that: zoomed out=smaller movement, zoomedin=larger movement.
}

function shiftPZCS(x) {
    if (parseInt(leftPanZoomHandle.getAttribute('cx')) + x >= 0 && parseInt(rightPanZoomHandle.getAttribute('cx')) + x <= (timeline.clientWidth - 40)) {
        rightPanZoomHandle.setAttribute('cx', parseInt(rightPanZoomHandle.getAttribute('cx')) + x);
        leftPanZoomHandle.setAttribute('cx', parseInt(leftPanZoomHandle.getAttribute('cx')) + x);
        barPanZoom.setAttribute('x1', parseInt(barPanZoom.getAttribute('x1')) + x);
        barPanZoom.setAttribute('x2', parseInt(barPanZoom.getAttribute('x2')) + x);
        timelinePosition += x;
        pattern.setAttribute('patternTransform', "scale("+ timelineZoom + ", 1) translate(" + -timelinePosition + ")");
        playhead.setAttribute('transform', "translate(" + -timelinePosition + ")");
    }
}