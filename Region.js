class Region extends Canvas_Primitive {
    path = [];

    idText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    idX;
    idY;

    constructor(path) {
        super(path[0].x, path[0].y, "gray");
        this.path = path;
        this.idText.setAttribute('text-anchor', "middle");
        this.idText.setAttribute('style', "font: 10px sans-serif; fill: blue");
        this.idText.innerHTML = "A1b";
    }

    updateD() {
        this.d = "M" + this.x + " " + this.y;
        for (let i = 1; i < this.path.length; i++) {
            this.d += " L" + this.path[i].x + " " + this.path[i].y;
        }
        this.d += " L" + this.x + " " + this.y;
        this.svg.setAttribute('d', this.d);
        this.updateCenter();
    }

    render() {
        super.render();
        this.svg.setAttribute('stroke', "none");
        this.svg.setAttribute('fill', this.color);
        this.svg.setAttribute('opacity', "0.25");
        this.g.appendChild(this.idText);
        this.updateCenter();
    }

    updateCenter() {
        let polygon = [];
        for (const node of this.path) {
            polygon.push([node.x, node.y]);
        }
        [this.idX, this.idY] = Util.vizCenter([polygon]);
        this.idText.setAttribute('x', this.idX);
        this.idText.setAttribute('y', this.idY);
    }
}