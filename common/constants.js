const BOB = 0;
const BULLET = 1;
const FOOD = 2;

const FROM_TOP = 0;
const FROM_RIGHT = 1;
const FROM_BOTTOM = 2;
const FROM_LEFT = 3;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FROM_TOP,
    FROM_RIGHT,
    FROM_BOTTOM,
    FROM_LEFT,
    BOB,
    BULLET,
    FOOD
  };
}

