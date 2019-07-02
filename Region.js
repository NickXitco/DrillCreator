class Region extends Canvas_Primitive {
    path = [];

    idText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    idX;
    idY;

    constructor(path) {
        super(path[0].x, path[0].y, "#cccccc");
        this.path = path;
        this.idText.setAttribute('text-anchor', "middle");
        this.idText.setAttribute('style', "font: 10px sans-serif; fill: blue");
        this.idText.innerHTML = "A1b";
    }

    updateD() {
        this.d = "M" + this.x + " " + this.y;
        console.log(this.path);
        for (let i = 1; i < this.path.length; i++) {
            if (this.path[i].primitives[0] instanceof Curve) {
                this.d += " Q" + this.path[i].primitives[0].controlPoint.x + " " + this.path[i].primitives[0].controlPoint.y + " " + this.path[i].x + " " + this.path[i].y;
            } else {
                this.d += " L" + this.path[i].x + " " + this.path[i].y;
            }
        }
        if (this.path[0].primitives[0] instanceof Curve) {
            this.d += " Q" + this.path[0].primitives[0].controlPoint.x + " " + this.path[0].primitives[0].controlPoint.y + " " + this.x + " " + this.y;
        } else {
            this.d += " L" + this.x + " " + this.y;
        }
        this.svg.setAttribute('d', this.d);
        this.updateCenter();
    }

    render() {
        this.updateD();
        this.svg.setAttribute('stroke', "none");
        this.svg.setAttribute('fill', this.color);
        this.svg.setAttribute('opacity', "0.25");
        this.g.insertBefore(this.svg, selectionDummy);
        this.g.appendChild(this.expandedSVG);
        this.g.appendChild(this.idText);
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

    setColor(color) {
        super.setColor(color);
        this.svg.setAttribute('fill', this.color);
    }

    destroy() {
        this.g.removeChild(this.idText);
        super.destroy();
    }
}