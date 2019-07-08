const electron = require('electron');
const {ipcRenderer} = electron;


const createNewButton = document.querySelector('#createNew');
createNewButton.addEventListener('click', openNewItemDialog);

function openNewItemDialog() {
    ipcRenderer.send('new:open');
}

let down = {x: null, y: null};

let activeDrawing = {drawing: null, type: null};
let bools = {movingSelection: false, multiSelecting: false};
let multiSelectRect = createMultiSelectRect();
let selection = {rect: multiSelectRect, primitives: []};

let gridMultiple = 1;

let lines = [];
let pointsOfInterest = new Set();
let poiIDCounter = 0;
let edges = new Set();
let regions = new Set();

/*
let keyframes = [];

let key = {function: KeyframeFunctions.set_x, object: activeDrawing, value: 400, time: 0};
key.function(key.value, key.object);
*/

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

svgCanvas.onmousedown = function(e){
    let {x, y} = Util.virtualRoundedXY(e, svgCanvas, g, gridMultiple);
    x = parseInt(x);
    y = parseInt(y);
    if (e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        drawDown(x, y, activeDrawing, lines);
    } else if (e.button === 0 && (currentTool === tools.SELECT)) {
        selectDown(e, x, y, down, bools, selection);
    } else if (e.button === 1) {
        //middle click
        panZoomCanvas.enablePan();
    }
};

svgCanvas.onmousemove = function(e) {
    let {x, y} = Util.virtualRoundedXY(e, svgCanvas, g, gridMultiple);
    x = parseInt(x);
    y = parseInt(y);
    if (activeDrawing.drawing != null && e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        drawMove(x, y, activeDrawing, lines);
    } else if (currentTool === tools.SELECT) {
        if (selection.primitives.length === 0 && bools.multiSelecting) {
            moveMultiSelectRect(x, y, down, selection);
        } else if (bools.movingSelection){
            selectMove(x, y, down, selection, lines);
        } else {
            updateMouseFields(x, y);
        }
    }
};

svgCanvas.onmouseup = function(e) {
    let {x, y} = Util.virtualRoundedXY(e, svgCanvas, g, gridMultiple);
    x = parseInt(x);
    y = parseInt(y);
    if (activeDrawing.drawing != null && e.button === 0 && (currentTool === tools.LINE || currentTool === tools.CURVE)) {
        drawUp(x, y, activeDrawing, lines);
        let anchorPOI = createNewPOI(activeDrawing.drawing.anchor);
        let endpointPOI = createNewPOI(activeDrawing.drawing.endpoint);
        createNewEdge(anchorPOI, endpointPOI, activeDrawing.drawing);
        handleRegionCreation([activeDrawing.drawing]);
        activeDrawing.drawing = null;
        activeDrawing.type = null;
    } else if (e.button === 0 && currentTool === tools.SELECT) {
        selectUp(bools, selection, lines);
        if (selection.primitives.length === 1 && selection.primitives[0] instanceof Point) {
            let edge = getEdge(getPOI(selection.primitives[0].parentLine.anchor), getPOI(selection.primitives[0].parentLine.endpoint));
            console.log({edge});
            let regionsToUpdate = getRegions(edge);
            for (const region of regionsToUpdate) {
                region.updateD();
            }
        } else {
            handleRegionDeletion(selection.primitives);
            resolvePOIs(selection.primitives);
            handleRegionCreation(selection.primitives);
        }
    } else if (e.button === 1) {
        panZoomCanvas.disablePan();
    }
};

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

function createMultiSelectRect() {
    let multiSelectRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    multiSelectRect.setAttribute('stroke', 'gray');
    multiSelectRect.setAttribute('fill', 'none');
    multiSelectRect.setAttribute('stroke-dasharray', '3');
    return multiSelectRect;
}

function createNewPOI(endpoint) {
    for (const point of pointsOfInterest) {
        if (point.x === endpoint.x && point.y === endpoint.y) {
            point.endpoints.add(endpoint);
            return point;
        }
    }
    let newPoi = new POI(endpoint, poiIDCounter);
    poiIDCounter++;
    pointsOfInterest.add(newPoi);
    return newPoi;
}

function createNewEdge(anchorPOI, endpointPOI, line) {
    edges.add(new Edge(anchorPOI, endpointPOI, line));
}

function getPOI(endpoint) {
    for (const point of pointsOfInterest) {
        if (point.endpoints.has(endpoint)) {
            return point;
        }
    }
    return null;
}

function mergePOIs(master, slave) {
    for (const point of slave.endpoints) {
        master.endpoints.add(point);
    }

    for (const edge of getEdges(slave)) {
        edges.delete(edge);
        if (edge.u === slave) {
            createNewEdge(master, edge.v, edge.line);
        } else if (edge.v === slave) {
            createNewEdge(edge.u, master, edge.line);
        }
    }

    pointsOfInterest.delete(slave);
}

function getEdges(poi) {
    let result = [];
    for (const edge of edges) {
        if (edge.u === poi || edge.v === poi) {
            result.push(edge);
        }
    }
    return result;
}

function getEdge(poi1, poi2) {
    for (const edge of edges) {
        if ((edge.u === poi1 && edge.v === poi2) || (edge.u === poi2 && edge.v === poi1)) {
            return edge;
        }
    }
    return null;
}

/***
 * Gets all regions incident to a given edge
 * @param edge
 * @returns {Array} Incident regions
 */
function getRegions(edge) {
    let incidentRegions = [];
    for (const region of regions) {
        if (region.edges.includes(edge)) {
            incidentRegions.push(region);
        }
    }
    return incidentRegions;
}

function getNeighbors(poi) {
    let neighbors = [];
    for (const edge of edges) {
        if (edge.u === poi) {
            neighbors.push(edge.v);
        } else if (edge.v === poi) {
            neighbors.push(edge.u);
        }
    }
    return neighbors;
}

function separatePOI(poi, endpoint) {
    let u = poi;
    let v;
    if (endpoint.endpointClass === epClasses.ANCHOR) {
        v = getPOI(endpoint.parentLine.endpoint);
    } else {
        v = getPOI(endpoint.parentLine.anchor);
    }

    let edge = getEdge(u, v);
    edges.delete(edge);
    poi.removeEndpoint(endpoint);
    createNewEdge(createNewPOI(endpoint), v, edge.line);
}

/***
 *
 * @param {Array} selection
 */
function resolvePOIs(selection) {
    let pointsToResolve = [];
    for (const prim of selection) {
        if (prim instanceof Line) {
            let p = getPOI(prim.anchor);
            if (p !== null) {
                pointsToResolve.push({poi: p, endpoint: prim.anchor});
            }
            p = getPOI(prim.endpoint);
            if (p !== null) {
                pointsToResolve.push({poi: p, endpoint: prim.endpoint});
            }
        } else if (prim instanceof Endpoint) {
            let p = getPOI(prim);
            if (p !== null) {
                pointsToResolve.push({poi: p, endpoint: prim});
            }
        }
    }

    for (const pointObject of pointsToResolve) {
        let filter = pointsToResolve.filter(item => item.poi === pointObject.poi);
        if (filter.length === pointObject.poi.endpoints.size) {
            pointObject.poi.move(pointObject.endpoint.x, pointObject.endpoint.y);
            for (const point of pointsOfInterest) {
                if (point !== pointObject.poi && point.x === pointObject.poi.x && point.y === pointObject.poi.y) {
                    mergePOIs(point, pointObject.poi);
                }
            }
        } else {
            separatePOI(pointObject.poi, pointObject.endpoint);
        }
    }
}


/***
 * Converts a path of POIs to a path of edges
 * @param {Array} newRegion array of POIs defining a closed cycle
 * @returns {Array} newRegionEdges array of edges defining the same cycle
 */
function poiPathToEdges(newRegion) {
    let newRegionEdges = [];
    for (let i = 0; i < newRegion.length; i++) {
        if (i + 1 === newRegion.length) {
            newRegionEdges.push(getEdge(newRegion[i], newRegion[0]));
        } else {
            newRegionEdges.push(getEdge(newRegion[i], newRegion[i + 1]));
        }
    }
    return newRegionEdges;
}

// noinspection JSUnusedLocalSymbols
/***
 * Converts a path of edges to a path of POIs
 * @param {Array} path array of edges defining a closed cycle
 * @returns {Array} newPathPOIs array of POIs defining the same cycle
 */
function edgePathToPOIs(path) {
    let newPathPOIs = [];
    //find common node between first and last edge
    let node;
    if (path[0].u === path[path.length - 1].u || path[0].u === path[path.length - 1].v) {
        node = path[0].u;
    } else if (path[0].v === path[path.length - 1].u || path[0].v === path[path.length - 1].v) {
        node = path[0].v;
    }
    newPathPOIs.push(node);
    for (let i = 0; i < path.length - 1; i++) {
        if (path[i].u === node) {
            node = path[i].v;
        } else {
            node = path[i].u;
        }
        newPathPOIs.push(node);
    }
    return newPathPOIs;
}

/***
 * Creates new region(s) based on a selection of lines/endpoints.
 * @param {Array} selection a collection (sometimes and usually only 1) line.
 */
function handleRegionCreation(selection) {
    for (const prim of selection) {
        let edge;
        if (prim instanceof Line) {
            edge = getEdge(getPOI(prim.anchor), getPOI(prim.endpoint));
        } else if (prim instanceof Endpoint) {
            if (prim.endpointClass === epClasses.ANCHOR) {
                edge = getEdge(getPOI(prim), getPOI(prim.parentLine.endpoint));
            } else {
                edge = getEdge(getPOI(prim.parentLine.anchor), getPOI(prim));
            }
        }

        let validRegions = []; //2D array of in order edges
        if (edge.u.endpoints.size > 1 && edge.v.endpoints.size > 1) {
            validRegions = regionSearch(edge, validRegions);
        }

        for (const poiPath of validRegions) {
            let r = new Region(poiPath, poiPathToEdges(poiPath));
            r.render();
            regions.add(r);
        }
    }
    //TODO handle splitting edges
}

/***
 * Properly deletes any region involved with a selection of lines/endpoints
 * @param {Array} selection a collection (sometimes and usually only 1) line.
 */
function handleRegionDeletion(selection) {
    for (const prim of selection) {
        let edge;
        if (prim instanceof Line) {
            edge = getEdge(getPOI(prim.anchor), getPOI(prim.endpoint));
        } else if (prim instanceof Endpoint) {
            if (prim.endpointClass === epClasses.ANCHOR) {
                edge = getEdge(getPOI(prim), getPOI(prim.parentLine.endpoint));
            } else {
                edge = getEdge(getPOI(prim.parentLine.anchor), getPOI(prim));
            }
        }
        let incidentRegions = getRegions(edge);
        for (const region of incidentRegions) {
            regions.delete(region);
            region.destroy();
        }
    }
    //TODO handle splitting edges
}

/***
 * Checks if a path envelops the center of another line, and is therefore invalid.
 * @param {Array} path array of POIs defining a closed cycle
 * @returns {boolean} if a path is valid (true) or not (false)
 */
function validPath(path) {
    let edgePath = poiPathToEdges(path);
    for (const edge of edges) {
        if (!edgePath.includes(edge)) {
            let point = {x: edge.line.centerX, y: edge.line.centerY};
            let counter = 0;
            let i;
            let intersection;
            let p1, p2;

            p1 = path[0];
            for (i = 1; i <= path.length; i++) {
                p2 = path[i % path.length];
                if (point.y > Math.min(p1.y, p2.y) && point.y <= Math.max(p1.y, p2.y)) {
                    if (point.x <= Math.max(p1.x, p2.x)) {
                        if (p1.y !== p2.y) {
                            intersection = (point.y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x;
                            if (p1.x === p2.x || point.x <= intersection) {
                                counter++;
                            }
                        }
                    }
                }
                p1 = p2;
            }

            if (counter % 2 !== 0) {
                return false;
            }
        }
    }
    return true;
}

function regionExists(path) {
    for (const region of regions) {
        let counter = 0;
        for (const poi of path) {
            if (region.poiPath.includes(poi)) {
                counter++;
            }
        }
        if (counter === path.length) {
            return true;
        }
    }
    return false;
}

/***
 * Basically runs many searches from an edge, and returns at most 2 valid cycles.
 * @param edge
 * @param validRegions
 * @returns {Array} validRegions Array of shortest incident cycles (Max size of 2)
 */
function regionSearch(edge, validRegions) {
    let source = edge.u;
    let dest = edge.v;
    edges.delete(edge); //Temporary removal so we can't shortcut the cycle backwards.

    let paths = [];
    DFS(source, []);
    // START DFS
    function DFS(v, path) {
        for (const neighbor of getNeighbors(v)) {
            if (!path.includes(getEdge(v, neighbor))) {
                if (neighbor === dest) {
                    path.push(getEdge(v, neighbor));
                    path.push(edge); //Push the deleted src-dest edge
                    paths.push(path);
                    return;
                }
                //Clone the current path, add the new edge, and push it along
                let fork = [...path];
                fork.push(getEdge(v, neighbor));
                DFS(neighbor, fork);
            }
        }
    }
    // END DFS
    edges.add(edge);
    console.log({paths});
    for (const path of paths) {
        let convert = edgePathToPOIs(path);
        if (validPath(convert) && !regionExists(convert)) {
            validRegions.push(convert);
        }
    }

    if (validRegions.length > 2) {
        console.log("what the fuck did you do wrong???");
    }
    return validRegions;
}