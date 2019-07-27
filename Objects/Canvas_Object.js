class Canvas_Object {
    x;
    y;

    height;
    width;

    color;
    name;
    id;
    picture;

    face;

    svg;
    pattern;
    clickListener;
    visibility = true;

    self = this;

    g = document.querySelector('#svgG');
    canvasDefs = document.querySelector('#canvasDefs');

    constructor(x, y, height, width, color, name, id, picture) {
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
        this.color = color;
        this.name = name;
        this.id = id;
        this.picture = picture;
    }

    setLocation(x, y){};

    shift(dx, dy){};

    highlightOn(){};

    setFace(face) {
        this.face = face;
    }
}