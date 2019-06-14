class Canvas_Object {
    x;
    y;
    height;
    width;
    color;
    name;
    id;
    picture;
    timestep;

    svg;
    clickListener;
    visibility = true;

    canvas = document.querySelector('#svgG');

    constructor(x, y, height, width, color, name, id, picture, timestep) {
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
        this.color = color;
        this.name = name;
        this.id = id;
        this.picture = picture;
        this.timestep = timestep;
    }

    render(){
    };
}