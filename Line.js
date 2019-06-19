class Line extends Canvas_Primitive {
    endpointX;
    endpointY;

    anchorSVG = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    endpointSVG = document.createElementNS('http://www.w3.org/2000/svg', 'rect');


    constructor (x, y, endpointX, endpointY, color) {
        super(x, y, color);
        this.endpointX = endpointX;
        this.endpointY = endpointY;
        this.svg.setAttribute('stroke-width', "2");
        Line.createAnchorPoint(this.anchorSVG, x, y);
        Line.createAnchorPoint(this.endpointSVG, x, y);
    }

    renderAnchors() {
        this.g.appendChild(this.anchorSVG);
        this.g.appendChild(this.endpointSVG);
    }

    showAnchors(){
        this.anchorSVG.setAttribute('visibility', "visible");
        this.anchorSVG.setAttribute('id', "activeAnchor");
        this.endpointSVG.setAttribute('visibility', "visible");
        this.endpointSVG.setAttribute('id', "activeEndpointAnchor");
    }

    hideAnchors(){
        this.anchorSVG.setAttribute('visibility', "hidden");
        this.anchorSVG.removeAttribute('id');
        this.endpointSVG.setAttribute('visibility', "hidden");
        this.endpointSVG.removeAttribute('id');
    }

    static createAnchorPoint(svg, x, y) {
        svg.setAttribute('width', "5");
        svg.setAttribute('height', "5");
        svg.setAttribute('style', "fill:white;stroke:blue;stroke-width:1");
        Line.moveAnchorPoint(svg, x, y);
    }

    static moveAnchorPoint(svg, x, y) {
        svg.setAttribute('x', (x - 2.5).toString());
        svg.setAttribute('y', (y - 2.5).toString());
    }

    updateD() {
        this.d = "M" + this.x + " " + this.y + " L" + this.endpointX + " " + this.endpointY;
        this.svg.setAttribute('d', this.d);
        Line.createAnchorPoint(this.anchorSVG, this.x, this.y);
        Line.createAnchorPoint(this.endpointSVG, this.endpointX, this.endpointY);
    }

    setColor(color) {
        this.color = color;
        this.svg.setAttribute('stroke', color);
    }

    updateEndpoint(x, y) {
        this.endpointX = x;
        this.endpointY = y;
        this.updateD()
    }

    updateAnchor(x, y) {
        this.x = x;
        this.y = y;
        this.updateD()
    }

    getLength() {
        return Math.sqrt(Math.pow(this.x - this.endpointX,2) + Math.pow(this.y - this.endpointY,2));
    }

    highlightOn() {
        this.svg.setAttribute('stroke', "green");
    }

    highlightOff() {
        this.svg.setAttribute('stroke', this.color);
    }

    selectShift(x, y) {
        this.x += x;
        this.y += y;
        this.endpointX += x;
        this.endpointY += y;
        this.updateD();
    }
}