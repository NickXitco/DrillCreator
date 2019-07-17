class Canvas_Primitive {
    id;
    x;
    y;
    d = "";

    self = this;

    color;
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    expandedSVG = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    visibility = true;

    destroyed = false;

    g = document.querySelector('#svgG');

    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.svg.addEventListener("click", this.click);
        this.svg.addEventListener("mouseenter", this.hoverOn);
        this.svg.addEventListener("mouseleave", this.hoverOff);

        $(this.svg).data(this.self);
        $(this.expandedSVG).data(this.self);
    }

    hoverOn(){};

    hoverOff(){};

    click(){};

    updateD(){};

    render() {
        this.svg.setAttribute('stroke', this.color);
        this.svg.setAttribute('fill', "none");
        this.svg.setAttribute('stroke-linecap', "round");
        this.expandedSVG.setAttribute('stroke', "pink");
        this.expandedSVG.setAttribute('stroke-width', "20");
        this.expandedSVG.setAttribute('stroke-linecap', "round");
        this.expandedSVG.setAttribute('opacity', "0.1");
        this.expandedSVG.setAttribute('fill', "none");
        this.updateD();
        this.g.insertBefore(this.expandedSVG, selectionDummy);
        this.g.insertBefore(this.svg, drawingsDummy);
    };

    destroy() {
        this.g.removeChild(this.svg);
        this.destroyed = true;
    }

    setID(id) {
        this.id = id;
        this.svg.setAttribute('id', id);
    }

    highlightOn() {};

    highlightOff() {};

    shift() {};

    setColor(color) {
        this.color = color;
    };
}