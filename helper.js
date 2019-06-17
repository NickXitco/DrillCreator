class Util {
    static round(num, gridMultiple) {
        if (num % gridMultiple === 0) {
            return num
        } else if (num % gridMultiple < gridMultiple/2) {
            return num - (num % gridMultiple);
        } else {
            return num + (gridMultiple - num % gridMultiple);
        }
    }

    /**
     * Transforms 'regular' coordinates into virtual SVG coordinates.
     * @param x "Real" Screen X coordinate
     * @param y "Real" Screen Y coordinate
     * @param svgCanvas Canvas to manipulate point on
     * @param g SVG G object containing the transformation
     * @returns svgDropPoint a DOM with a "Virtual" SVG X and Y attached.
     */
    static getSvgPoint(x, y, svgCanvas, g) {
        let svgDropPoint = svgCanvas.createSVGPoint();

        svgDropPoint.x = x;
        svgDropPoint.y = y;

        svgDropPoint = svgDropPoint.matrixTransform(g.getCTM().inverse());
        return svgDropPoint;
    }
    
    static emptySlot(array){
        for (let i = 0; i < array.length; i++) {
            if (array[i] === undefined) {
                return i;
            }
        }
        return array.length;
    }
    
}
