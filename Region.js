class Region extends Canvas_Primitive {
    poiPath = []; //IN ORDER array of edges that make up the region.
    edges = [];

    idText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    idX;
    idY;

    constructor(poiPath, edgePath) {
        super(poiPath[0].x, poiPath[0].y, "#cccccc");
        this.poiPath = poiPath;
        this.edges = edgePath;
        this.idText.setAttribute('text-anchor', "middle");
        this.idText.setAttribute('style', "font: 10px sans-serif; fill: blue");
        this.idText.innerHTML = "A1b";
    }

    hoverOn() {
        $(this).data().self.svg.setAttribute('fill', "#00bbbb");
    }

    hoverOff() {
        $(this).data().self.svg.setAttribute('fill', $(this).data().self.color);
    }

    updateD() {
        let node = this.poiPath[0];
        this.d = "M " + node.x + " " + node.y;

        for (let i = 1; i < this.poiPath.length + 1; i++) {
            let edge = this.getEdge(node, this.poiPath[i % this.poiPath.length]);
            node = this.poiPath[i % this.poiPath.length];
            if (edge.line instanceof Curve) {
                this.d += " Q " + edge.line.controlPoint.x + " " + edge.line.controlPoint.y + " " + node.x + " " + node.y;
            } else {
                this.d += " L " + node.x + " " + node.y;
            }
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
        this.g.appendChild(this.idText);
    }

    getEdge(poi1, poi2) {
        for (const edge of this.edges) {
            if ((edge.u === poi1 && edge.v === poi2) || (edge.u === poi2 && edge.v === poi1)) {
                return edge;
            }
        }
        return null;
    }

    updateCenter() {
        let polygon = [];
        for (const poi of this.poiPath) {
            polygon.push([poi.x, poi.y]);
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