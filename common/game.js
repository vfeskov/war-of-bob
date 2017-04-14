'use strict';
+function({assign}, target) {
  const c = {
    BOB: 0,
    BULLET: 1,
    FOOD: 2,

    FROM_TOP: 0,
    FROM_RIGHT: 1,
    FROM_BOTTOM: 2,
    FROM_LEFT: 3,

    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
  };

  assign(target, {moveProjectile}, c);

  function moveProjectile(projectile) {
    const nextProjectile = assign({}, projectile);
    if (nextProjectile.brandNew) { delete nextProjectile.brandNew; }
    let {source, x, y} = nextProjectile;
    switch (source) {
      case c.FROM_TOP:     y++; break;
      case c.FROM_RIGHT:   x--; break;
      case c.FROM_BOTTOM:  y--; break;
      case c.FROM_LEFT:    x++; break;
    }
    return assign(nextProjectile, {x, y});
  }
}(Object, (typeof module !== 'undefined') ? module.exports : self.Game = {});
