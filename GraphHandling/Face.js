class Face {
    outer_edge;
    inner_edges = [];

    global;

    idText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    id;
    idX;
    idY;

    color;

    d = "";

    self = this;

    svg = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    g = document.querySelector('#svgG');

    constructor(outer_edge, inner_edges) {
        this.outer_edge = outer_edge;
        this.inner_edges = inner_edges;

        if (this.outer_edge !== null) {
            this.setColor("#cccccc");

            this.idText.setAttribute('text-anchor', "middle");
            this.idText.setAttribute('style', "font: 10px sans-serif; fill: blue");
            this.idText.innerHTML = "A1b";

            this.svg.addEventListener("mouseenter", this.hoverOn);
            this.svg.addEventListener("mouseleave", this.hoverOff);

            $(this.svg).data(this.self);

            this.render();
        }
    }

    //<editor-fold desc="Visuals">
    hoverOn() {
        $(this).data().self.svg.setAttribute('fill', "#00bbbb");
    }

    hoverOff() {
        $(this).data().self.svg.setAttribute('fill', $(this).data().self.color);
    }

    updateD() {
        this.d = "";
        this.walkCycleUpdateD(this.outer_edge);

        for (const inner of this.inner_edges) {
            this.walkCycleUpdateD(inner);
        }

        this.svg.setAttribute('d', this.d);
        this.updateCenter();
    }

    walkCycleUpdateD(start) {
        let current = start;
        this.d += "M " + start.origin.x + " " + start.origin.y;

        do {
            if (current.line instanceof Curve) {
                //We have to skip one because of the way curves are handled.
                let skip = current.next;
                this.d += "Q " + current.line.controlPoint.x + " " + current.line.controlPoint.y + " " + skip.destination().x + " " + skip.destination().y;
                if (skip === start) {
                    break;
                }
                current = current.next;
            } else {
                this.d += "L " + current.destination().x + " " + current.destination().y;
            }
            current = current.next;
        } while (start !== current);
    }

    render() {
        this.updateD();
        this.svg.setAttribute('stroke', "none");
        this.svg.setAttribute('fill', this.color);
        this.svg.setAttribute('opacity', "0.25");
        this.g.insertBefore(this.svg, selectionDummy);
        this.g.appendChild(this.idText);
    }

    updateCenter() {
        let polygon = [];
        let start = this.outer_edge;
        let current = start;

        do {
            polygon.push([current.origin.x, current.origin.y]);
            current = current.next;
        } while (start !== current);

        [this.idX, this.idY] = Util.vizCenter([polygon]);
        this.idText.setAttribute('x', this.idX);
        this.idText.setAttribute('y', this.idY);
    }

    setColor(color) {
        this.color = color;
        this.svg.setAttribute('fill', this.color);
    }

    destroy() {
        this.g.removeChild(this.idText);
        this.g.removeChild(this.svg);
    }
    //</editor-fold>
    //<editor-fold desc="DCEL">
    setFaceRecordsOnEdges() {
        if (this.outer_edge !== null) {
            let start = this.outer_edge;
            start.face = this;
            let current = start.next;
            while (current !== start) {
                current.face = this;
                current = current.next;

            }
        }
        if (this.inner_edges.length > 0) {
            for (const inner_edge of this.inner_edges) {
                let start = inner_edge;
                start.face = this;
                let current = start.next;
                while (current !== start) {
                    current.face = this;
                    current = current.next;
                }
            }
        }
    }

    /***
     *
     * @param {HalfEdge} outer_edge
     * @param {HalfEdge[]} inner_edges
     * @return {Face}
     */
    static addFace(outer_edge, inner_edges) {
        return new Face(outer_edge, inner_edges);
    }
    //</editor-fold>
}