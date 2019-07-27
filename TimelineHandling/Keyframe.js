const tweens = {
    HOLD: 0,
    LINEAR: 1,
    EASE_IN: 2,
    EASE_OUT: 3,
    EASE: 4
};

const properties = {
    X: 0,
    Y: 1,
    COLOR: 2,
};


class Keyframe {
    tweenType;
    obj;
    property;
    newValue;
}