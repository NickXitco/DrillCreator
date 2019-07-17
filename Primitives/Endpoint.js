const epClasses = {
    ENDPOINT: 'endpoint',
    ANCHOR: 'anchor'
};

class Endpoint extends Point {
    constructor(x, y, line, epClass) {
        super(x, y, line);
        this.endpointClass = epClass;
    }

    setLocation(x, y) {
        super.setLocation(x, y);
        this.svg.setAttribute('x', (this.x - 2.5).toString());
        this.svg.setAttribute('y', (this.y - 2.5).toString());

        if (this.endpointClass === epClasses.ANCHOR) {
            this.parentLine.updateAnchor(x, y);
        } else if (this.endpointClass === epClasses.ENDPOINT) {
            this.parentLine.updateEndpoint(x, y);
        }
    }
}