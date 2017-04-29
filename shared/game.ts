const BOB = 0,
  BULLET = 1,
  FOOD = 2,

  FROM_TOP = 0,
  FROM_RIGHT = 1,
  FROM_BOTTOM = 2,
  FROM_LEFT = 3,

  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3;

export {
  moveProjectile, BOB, BULLET, FOOD, FROM_TOP, FROM_RIGHT, FROM_BOTTOM, FROM_LEFT, UP, RIGHT, DOWN, LEFT
};

const {assign} = Object;

function moveProjectile(projectile) {
  const nextProjectile = assign({}, projectile);
  if (nextProjectile.brandNew) { delete nextProjectile.brandNew; }
  let {source, x, y} = nextProjectile;
  switch (source) {
    case FROM_TOP:     y++; break;
    case FROM_RIGHT:   x--; break;
    case FROM_BOTTOM:  y--; break;
    case FROM_LEFT:    x++; break;
  }
  return assign(nextProjectile, {x, y});
}
