const namespace = 'http://www.w3.org/2000/svg';

class Person extends Canvas_Object {
    shape = "circle";
    part;
    pattern;
    patternID;

    constructor(x, y, color, name, id, picture, part) {
        super(x, y, 50, 50, color, name, id, picture);
        this.patternID = Math.random().toString();
        this.part = part;
        this.createPattern();
        if (this.picture === null) {
            this.pattern.appendChild(Person.createColorFill(this.color));
            this.pattern.appendChild(Person.createTextFill(this.name));
        } else {
            this.pattern.appendChild(Person.createImageFill(this.picture));
        }
        this.setupSVG();
        $(this.svg).data(this.self);
        this.g.appendChild(this.svg)
    }

    static addPerson(name, image) {
        return new Person(900 * (1 - Math.random()/4), 1000 * (1 - Math.random()/4), "#0a6b7b", name, 0, image, "");
    }

    static createTextFill(name) {
        const text = document.createElementNS(namespace, 'text');
        text.setAttribute('x', "50");
        text.setAttribute('y', "50");
        text.setAttribute('text-anchor', "middle");
        text.setAttribute('alignment-baseline', "central");
        text.setAttribute('style', "font: bold 50px sans-serif; fill: white");
        const textNode = document.createTextNode(name[0].toUpperCase());
        text.appendChild(textNode);
        return text;
    }

    static createImageFill(img) {
        const image = document.createElementNS(namespace, 'image');
        image.setAttributeNS("http://www.w3.org/1999/xlink",'xlink:href', img.path);
        let newWidth, newHeight;

        if (img.height < img.width) {
            //Landscape image, so we want to cut off the right and left sides
            newHeight = 100;
            const scaleFactor = img.height / newHeight;
            newWidth = img.width / scaleFactor;
        } else {
            //Square or portrait
            newWidth = 100;
            const scaleFactor = img.width / newWidth;
            newHeight = img.height / scaleFactor;
        }

        image.setAttribute('width', newWidth);
        image.setAttribute('height', newHeight);
        image.setAttribute('preserveAspectRatio', "xMinYMin meet");
        return image;
    }

    static createColorFill(color) {
        const rect = document.createElementNS(namespace, 'rect');
        rect.setAttribute('fill', color);
        rect.setAttribute('x', "0");
        rect.setAttribute('y', "0");
        rect.setAttribute('width', "100");
        rect.setAttribute('height', "100");
        return rect;
    }

    createPattern() {
        this.pattern = document.createElementNS(namespace, 'pattern');
        this.pattern.setAttribute('x', '0');
        this.pattern.setAttribute('y', '0');
        this.pattern.setAttribute('width', '1');
        this.pattern.setAttribute('height', '1');

        this.pattern.setAttribute('id', this.patternID);
        this.canvasDefs.appendChild(this.pattern);
    }

    setupSVG() {
        this.svg = document.createElementNS(namespace, this.shape);
        this.svg.setAttribute('cx', this.x);
        this.svg.setAttribute('cy', this.y);
        this.svg.setAttribute('r', this.width);
        this.svg.setAttribute('fill', "url(#" + this.patternID + ")");
        this.svg.setAttribute('stroke', "green");
        this.svg.setAttribute('stroke-width', "3");
    }

    setLocation(x, y) {
        this.x = x;
        this.y = y;
        this.svg.setAttribute('cx', x);
        this.svg.setAttribute('cy', y);
    }

    shift(dx, dy) {
        this.setLocation(this.x + dx, this.y + dy);
    }

    highlightOn() {
        this.svg.setAttribute('stroke', "lime");
        this.svg.setAttribute('stroke-width', "5");
        this.svg.setAttribute('opacity', 0.5);
    }

    highlightOff() {
        this.svg.setAttribute('stroke', "green");
        this.svg.setAttribute('stroke-width', "3");
        this.svg.setAttribute('opacity', 1);
    }
}