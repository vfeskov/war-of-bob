const {Observable: $, ReplaySubject, Subject} = require('rxjs');
const {randomInterval} = require('./util');
const {FROM_TOP, FROM_RIGHT, FROM_BOTTOM, FROM_LEFT, BOB, BULLET, FOOD} = require('./common/constants');
const {assign, keys} = Object;

const INITIAL_BOB = {id: 0, x: 47, y: 47, size: 6};
const DIRECTIONS = ['up', 'right', 'down', 'left'];

module.exports = () => {
  const clientRequest$ = new Subject();
  const bobDead$ = new ReplaySubject(1);

  const bobPlace$ = clientRequest$
    .filter(({type, direction}) =>
      ['move', 'stop'].includes(type) && DIRECTIONS.includes(direction)
    )
    .map(({type, direction}) =>
      ({[direction]: type === 'move' ? 1 : 0})
    )
    .scan((dirs, dir) => assign({}, dirs, dir), {})
    .distinctUntilChanged((next, prev) => !DIRECTIONS.some(d => next[d] !== prev[d]))
    .switchMap(dirs => {
      const {up, right, down, left} = dirs;
      return up || right || down || left ?
        $.timer(0, 25).mapTo(dirs) :
        $.empty();
    })
    .scan((bob, {up, right, down, left}) => {
      let {x, y, size} = bob;
      if (up && y > 0) { y--; }
      if (right && x < 100 - size) { x++; }
      if (down && y < 100 - size) { y++; }
      if (left && x > 0) { x--; }
      return assign({}, bob, {x, y});
    }, INITIAL_BOB)
    .startWith(INITIAL_BOB)
    .takeUntil(bobDead$)
    .publishReplay(1)
    .refCount();

  //each level takes 10 seconds * (2 ^ (level - 1)),
  //the higher the level the longer it takes to beat it
  const level$ = $.range(0, 6)
    .delayWhen(theLevel => $.interval(
      +function getDelay(level, base) {
        if (level === 0) { return 0; }
        return getDelay(level - 1, base) + Math.round(Math.pow(2, level - 1) * base);
      }(theLevel, 10000)
    ))
    .takeUntil(bobDead$)
    .publishReplay(1)
    .refCount();

  const projectile$ = level$
    .switchMap(level => randomInterval(200 - 25 * level, 400 - 50 * level))
    .scan(id => ++id, 1)
    .map(id => {
      const type = Math.floor(Math.random() * 10) ? BULLET : FOOD,
        size = Math.floor(Math.random() * 3) * 2 + 2, //2, 4 or 6
        source = Math.floor(Math.random() * 4),
        offset = Math.floor(Math.random() * (101 - size));
      let x, y;
      switch (source) {
        case FROM_TOP:     x = offset; y = -size;  break;
        case FROM_RIGHT:   x = 100;    y = offset; break;
        case FROM_BOTTOM:  x = offset; y = 100;    break;
        case FROM_LEFT:    x = -size;  y = offset; break;
      }
      return {id, x, y, size, source, type};
    })
    .takeUntil(bobDead$)
    .mergeMap(initialProjectile => {
      const projectile$ = $.timer(0, 25)
        .scan(projectile => {
          let {source, x, y} = projectile;
          switch (source) {
            case FROM_TOP:     y++; break;
            case FROM_RIGHT:   x--; break;
            case FROM_BOTTOM:  y--; break;
            case FROM_LEFT:    x++; break;
          }
          return assign({}, projectile, {x, y});
        }, initialProjectile)
        .share();

      const projectileDead$ = collision$
        .filter(([bob, projectile]) => projectile.id === initialProjectile.id)
        .merge(projectile$.filter(({source, x, y, size}) => {
          switch (source) {
            case FROM_TOP:     return y > 100;
            case FROM_RIGHT:   return x < -size;
            case FROM_BOTTOM:  return y < -size;
            case FROM_LEFT:    return x > 100;
          }
        }))
        .first()
        .mapTo({id: initialProjectile.id, dead: true})
        .delay(1)
        .share();

      return projectile$.takeUntil(projectileDead$).merge(projectileDead$);
    })
    .share();

  const collision$ = bobPlace$
    .combineLatest(projectile$)
    .filter(([bob, projectile]) =>
      (projectile.x + projectile.size - 1) >= bob.x &&
      projectile.x < bob.x + bob.size &&
      (projectile.y + projectile.size - 1) >= bob.y &&
      projectile.y < bob.y + bob.size
    )
    .share();

  const bobHp$ = collision$
    .map(([bob, projectile]) => projectile)
    .startWith(6)
    .scan((hp, projectile) =>
      projectile.type === BULLET ? hp - 1 : Math.min(hp + 1, 6)
    )
    .publishReplay(1)
    .refCount();

  const bob$ = bobPlace$
    .takeUntil(bobDead$)
    .merge(bobDead$)
    .share();

  const time$ = $.timer(0, 100)
    .takeUntil(bobDead$)
    .share();

  const bobDeadSub = bobHp$
    .filter(hp => hp === 0)
    .mapTo({id: INITIAL_BOB.id, dead: true})
    .first()
    .subscribe(bobDead$);

  return {
    bobHp$,
    bobDead$,
    bob$,
    projectile$,
    time$,
    level$,
    move: direction => clientRequest$.next({type: 'move', direction}),
    stop: direction => clientRequest$.next({type: 'stop', direction}),
    end: () => {
      bobDeadSub.unsubscribe();
      clientRequest$.complete();
    }
  };
};
