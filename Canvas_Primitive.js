class Canvas_Primitive {
    x;
    y;
    d = "";

    color;
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    visibility = true;

    connections;

    g = document.querySelector('#svgG');
    canvas = document.querySelector('#svgMain')

    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.svg.addEventListener("click", this.click);
    }

    click(){
        this.visibility = false;
        console.log("You CLICKED MEEEE.")
    }

    updateD(){
        console.log("This shouldn't have been called.");
    };

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
}