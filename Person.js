class Person extends Canvas_Object {
    shape = "circle";
    part;

    constructor(x, y, height, width, color, name, id, picture, timestep, part) {
        super(x, y, heigh, width, color, name, id, picture, timestep);
        this.part = part;
    }
}