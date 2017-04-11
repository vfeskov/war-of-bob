'use strict';
+function(
  {assign, keys},
  {random, pow, min, max, floor, round},
  {Observable: $, ReplaySubject, Subject},
  {randomInterval},
  target
) {
  const BOB = 0,
    BULLET = 1,
    FOOD = 2,

    FROM_TOP = 0,
    FROM_RIGHT = 1,
    FROM_BOTTOM = 2,
    FROM_LEFT = 3;

  assign(target, {moveProjectile, BOB, BULLET, FOOD, FROM_TOP, FROM_RIGHT, FROM_BOTTOM, FROM_LEFT, start});

  const INITIAL_BOB = {id: 0, x: 47, y: 47, size: 6};
  const DIRECTIONS = ['up', 'right', 'down', 'left'];

  function start() {
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
          $.of({});
      })
      .scan((bob, {up, right, down, left}) => {
        let {x, y, size} = bob;
        if (up && y > 0)              { y--; }
        if (right && x < 100 - size)  { x++; }
        if (down && y < 100 - size)   { y++; }
        if (left && x > 0)            { x--; }
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
          return getDelay(level - 1, base) + round(pow(2, level - 1) * base);
        }(theLevel, 10000)
      ))
      .takeUntil(bobDead$)
      .publishReplay(1)
      .refCount();

    const projectile$ = level$
      .switchMap(level => randomInterval(200 - 25 * level, 400 - 50 * level))
      .scan(id => ++id, 1)
      .map(id => {
        const type = floor(random() * 10) ? BULLET : FOOD,
          size = type === FOOD ? 4 : randomBulletSize(),
          source = floor(random() * 4),
          offset = floor(random() * (101 - size)),
          speed = 15 + (round(size / 2) - 1) * 10, //1% per 15, 25 or 35 ms
          hpImpact = type === FOOD ? 2 : -round(size / 2);
        let x, y;
        switch (source) {
          case FROM_TOP:     x = offset; y = -size;  break;
          case FROM_RIGHT:   x = 100;    y = offset; break;
          case FROM_BOTTOM:  x = offset; y = 100;    break;
          case FROM_LEFT:    x = -size;  y = offset; break;
        }
        return {id, x, y, size, source, type, speed, hpImpact, brandNew: true};
      })
      .takeUntil(bobDead$)
      .mergeMap(initialProjectile => {
        const projectile$ = $.interval(initialProjectile.speed)
          .startWith(initialProjectile)
          .scan(moveProjectile)
          .publishReplay(1)
          .refCount();

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
      .scan((hp, {hpImpact}) => hp = min(max(hp + hpImpact, 0), 6))
      .publishReplay(1)
      .refCount();

    const bob$ = bobPlace$
      .takeUntil(bobDead$)
      .merge(bobDead$)
      .share();

    const _time$ = $.of(Date.now())
      .mergeMap(start => $.timer(0, 1000).map(time => [start, time * 1000]))
      .takeUntil(bobDead$)
      .share();

    const time$ = _time$
      .map(([s, time]) => time)
      .merge(_time$.last().map(([start]) => Date.now() - start));

    const bobDeadSub = bobHp$
      .filter(hp => hp <= 0)
      .mapTo({id: INITIAL_BOB.id, dead: true})
      .first()
      .subscribe(bobDead$);

    return {
      bobHp$,
      bobDead$,
      bob$,
      projectile$: projectile$.filter(({brandNew, dead}) => brandNew || dead),
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

  function randomBulletSize() {
    const dice = floor(random() * 9);
    // out of 9 bullets
    // 2 are large
    if (dice < 2) { return 6; }
    // 3 are medium
    if (dice < 5)   { return 4; }
    // 4 are small
    return 2;
  }
}(Object, Math, ...(typeof module !== 'undefined') ?
  [require('rxjs'), require('./util'), module.exports] :
  [Rx, self.Util, self.Game = {}]
);
