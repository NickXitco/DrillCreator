class Region extends Canvas_Primitive {
    path = [];

    constructor(path) {
        super(path[0].x, path[0].y, "gray");
        this.path = path;
    }

    updateD() {
        this.d = "M" + this.x + " " + this.y;
        for (let i = 1; i < this.path.length; i++) {
            this.d += " L" + this.path[i].x + " " + this.path[i].y;
        }
        this.d += " L" + this.x + " " + this.y;
        this.svg.setAttribute('d', this.d);
    }

    render() {
        super.render();
        this.svg.setAttribute('stroke', "none");
        this.svg.setAttribute('fill', this.color);
        this.svg.setAttribute('opacity', "0.25");
    }
}