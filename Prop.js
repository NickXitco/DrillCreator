class Prop extends Canvas_Object {
    polygon;

    constructor(x, y, height, width, color, name, id, picture, timestep) {
        super(x, y, height, width, color, name, id, picture, timestep);
    }

    addPoint(x, y) {
        this.polygon.append([x, y]);
    }

    addPoints(points) {
        this.polygon = points;
    }
}