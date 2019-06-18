class Canvas_Primitive {
    id;
    x;
    y;
    d = "";

    color;
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    visibility = true;

    connections;

    g = document.querySelector('#svgG');
    canvas = document.querySelector('#svgMain');

    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.svg.addEventListener("click", this.click);
    }

    click(){};

    updateD(){};

    render() {
        this.svg.setAttribute('stroke', this.color);
        this.svg.setAttribute('fill', "none");
        this.updateD();
        this.g.appendChild(this.svg);
    };

    destroy() {
        this.g.removeChild(this.svg);
        delete this.svg;
        delete this;
    }

    setID(id) {
        this.id = id;
        this.svg.setAttribute('id', id);
    }

    highlightOn() {};

    highlightOff() {};
}