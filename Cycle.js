class Cycle {
    hedges = [];

    leftmostVertex;

    insideBoundary;

    neighbors = [];

    globalCycle = false;

    cycleArea;

    constructor(loop) {
        if (loop !== null && loop !== undefined) {
            this.hedges = loop;
            this.setLeftmostVertex();
            this.insideBoundary = this.area() >= 0;
        }
    }

    area() {
        let current = this.hedges[0];
        let area = 0;
        do {
            let p1 = current.origin;
            let p2 = current.destination();
            area += p1.x * p2.y - p1.y * p2.x;
            current = current.next;
        } while (current !== this.hedges[0]);
        this.cycleArea = area;
        return area;
    }

    setLeftmostVertex() {
        let leftmostVertex = null;
        let leftmostX = Infinity;
        for (const hedge of this.hedges) {
            if (hedge.origin.x < leftmostX) {
                leftmostX = hedge.origin.x;
                leftmostVertex = hedge.origin;
            } else if (hedge.origin.x === leftmostX) {
                if (hedge.origin.y > leftmostVertex.y) {
                    leftmostX = hedge.origin.x;
                    leftmostVertex = hedge.origin;
                }
            }
        }
        this.leftmostVertex = leftmostVertex
    }

    rightmostIntersection(y) {
        let rightmostX = -1;
        for (const hedge of this.hedges) {
            if (hedge.origin.y <= y && hedge.destination().y >= y) {
                let intersectRatio = (y - hedge.origin.y) / (hedge.destination().y - hedge.origin.y);
                let x = hedge.origin.x + intersectRatio * (hedge.destination().x - hedge.origin.x);
                rightmostX = x > rightmostX && hedge.angle < 180 ? x : rightmostX;
            }
        }
        return rightmostX;
    }
}