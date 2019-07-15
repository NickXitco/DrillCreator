class Region extends Canvas_Primitive {
    hedge;

    idText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    idX;
    idY;

    constructor(hedge) {
        super(hedge.origin.x, hedge.origin.y, "#cccccc");
        this.hedge = hedge;
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
        let start = this.hedge;
        let current = start;
        this.d = "M " + start.origin.x + " " + start.origin.y;

        do {
            if (current.line instanceof Curve) {
                this.d += "Q " + current.line.controlPoint.x + " " + current.line.controlPoint.y + " " + current.destination().x + " " + current.destination().y;
            } else {
                this.d += "L " + current.destination().x + " " + current.destination().y;
            }
            current = current.next;
        } while (start !== current);

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

    updateCenter() {
        let polygon = [];
        let start = this.hedge;
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
        super.setColor(color);
        this.svg.setAttribute('fill', this.color);
    }

    destroy() {
        this.g.removeChild(this.idText);
        super.destroy();
    }
}