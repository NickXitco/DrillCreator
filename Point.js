class Point {
    x;
    y;
    parentLine;
    svg;

    self = this;

    id;
    visibility;

    active = false;

    g = document.querySelector('#svgG');

    constructor(x, y, line) {
        this.parentLine = line;

        if (this instanceof ControlPoint) {
            this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            this.svg.setAttribute('r', "5");
            this.svg.setAttribute('style', "stroke:purple;stroke-width:1;fill:purple;fill-opacity: 0.5");
        } else if (this instanceof Endpoint) {
            this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            this.svg.setAttribute('width', "5");
            this.svg.setAttribute('height', "5");
            this.svg.setAttribute('style', "fill:white;stroke:blue;stroke-width:1");
        }

        this.setLocation(x, y);
        this.svg.addEventListener("click", this.click);
        $(this.svg).data(this.self);
        this.render();
    }

    click(){};

    render() {
        this.g.appendChild(this.svg);
    };

    setLocation(x, y) {
        this.x = x;
        this.y = y;
    }

    show() {
        this.visibility = true;
        this.svg.setAttribute('visibility', "visible");
    }

    hide() {
        this.visibility = false;
        this.svg.setAttribute('visibility', "hidden");
    }

    destroy() {
        this.g.removeChild(this.svg);
    }

    shift(dx, dy) {
        this.setLocation(this.x + dx, this.y + dy);
    }
}