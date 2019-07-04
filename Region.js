class Region extends Canvas_Primitive {
    path = []; //IN ORDER array of edges that make up the region.

    idText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    idX;
    idY;

    constructor(path) {
        super(path[0].u.x, path[0].u.y, "#cccccc");
        this.path = path;
        this.idText.setAttribute('text-anchor', "middle");
        this.idText.setAttribute('style', "font: 10px sans-serif; fill: blue");
        this.idText.innerHTML = "A1b";
    }

    updateD() {
        this.d = this.path[0].line.d;
        for (let i = 1; i < this.path.length; i++) {
            let split = this.path[i].line.d.split(" ");
            for (let j = 2; j < split.length; j++) {
                this.d += " " + split[j];
            }
        }
        let split = this.path[0].line.d.split(" ");
        for (let j = 2; j < split.length; j++) {
            this.d += " " + split[j];
        }
        this.svg.setAttribute('d', this.d);
        //this.updateCenter();
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