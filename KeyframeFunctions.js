class KeyframeFunctions {
    static set_x(obj, value) {
        obj.x = value;
        obj.updateD();
    }

    static set_y(obj, value) {
        obj.y = value;
        obj.updateD();
    }
}