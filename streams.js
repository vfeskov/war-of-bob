const {Observable, ReplaySubject, Subject} = require('rxjs');
const {FROM_TOP, FROM_RIGHT, FROM_BOTTOM, FROM_LEFT, BOB, BULLET, FOOD} = require('./common/constants');
const {assign} = Object;

module.exports = () => {
  let lastId = 0;

  const initialBob = {id: lastId++, x: 47, y: 47, size: 6};

  const keyEvent$ = new Subject();

  const bobDead$ = new ReplaySubject(1).first();

  const bobPlace$ = keyEvent$
    .map(getDirection)
    .filter(v => v)
    .scan((dirs, dir) => assign(dirs, dir))
    .map(dirs => {
      const {up, right, down, left} = dirs;
      return up || right || down || left ?
        Observable.timer(0, 25).mapTo(dirs) :
        Observable.empty();
    })
    .exhaust()
    .scan(moveBob, initialBob)
    .startWith(initialBob)
    .takeUntil(bobDead$)
    .publishReplay(1)
    .refCount();

  //each level takes 10 seconds * (2 ^ (level - 1)),
  //the higher the level the longer it takes to beat it
  const level$ = Observable.range(0, 6)
    .delayWhen(level => Observable.interval(getLevelDelay(level, 10000)))
    .takeUntil(bobDead$)
    .publishReplay(1)
    .refCount();

  const projectile$ = level$
    .switchMap(level => randomInterval(200 - 25 * level, 400 - 50 * level))
    .map(newProjectile)
    .takeUntil(bobDead$)
    .mergeMap(fireProjectile)
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

  bobHp$
    .filter(hp => hp === 0)
    .mapTo({id: initialBob.id, dead: true})
    .subscribe(bobDead$);

  const bob$ = bobPlace$
    .map(bob => assign({}, bob, {type: BOB}))
    .takeUntil(bobDead$)
    .merge(bobDead$)
    .share();

  const state$ = Observable.merge(bob$, projectile$)
    .scan((state, {id, type, source, size, x, y, dead}) => {
      // performance is especially crucial here hence mutation
      if (dead) {
        delete state[id];
      } else {
        state[id] = {id, type, source, size, x, y};
      }
      return state;
    }, {})
    .throttleTime(25)
    .map(state => assign({}, state));

  const time$ = Observable.timer(0, 100)
    .takeUntil(bobDead$)
    .scan(time => time + 1)
    .share();

  return {bobHp$, bobDead$, state$, time$, level$, keyEvent$};

  function uniqid() {
    return lastId++;
  }

  function moveBob(bob, {up, right, down, left}) {
    let {x, y, size} = bob;
    if (up && y > 0) { y--; }
    if (right && x < 100 - size) { x++; }
    if (down && y < 100 - size) { y++; }
    if (left && x > 0) { x--; }
    return assign({}, bob, {x, y});
  }

  function randomInterval(min, max) {
    return new Observable(sub => {
      let timeout = null;
      (function schedule() {
        timeout = setTimeout(
          () => {
            sub.next();
            schedule();
          },
          Math.floor(Math.random() * (max - min + 1) + min)
        );
      })();
      return () => clearTimeout(timeout);
    });
  }

  function newProjectile() {
    const id = lastId++;
    const type = Math.floor(Math.random() * 15) ? BULLET : FOOD
    const size = Math.floor(Math.random() * 3) * 2 + 2;
    const source = Math.floor(Math.random() * 4);
    const offset = Math.floor(Math.random() * (101 - size));
    let x, y;

    switch (source) {
      case FROM_TOP:     x = offset; y = -size;  break;
      case FROM_RIGHT:   x = 100;    y = offset; break;
      case FROM_BOTTOM:  x = offset; y = 100;    break;
      case FROM_LEFT:    x = -size;  y = offset; break;
    }

    return {id, x, y, size, source, type};
  }

  function fireProjectile(initialProjectile) {
    const projectile$ = Observable.timer(0, 25)
      .scan(projectile => {
        let {source, x, y} = projectile;
        switch (source) {
          case FROM_TOP:     y++; break;
          case FROM_RIGHT:   x--; break;
          case FROM_BOTTOM:  y--; break;
          case FROM_LEFT:    x++; break;
        }
        //must be faster than "return assign({}, projectile, {x, y});"
        //performance is crucial here
        projectile.x = x;
        projectile.y = y;
        return projectile;
      }, initialProjectile)
      .share();

    const projectileDead$ = Observable.race(
      collision$.filter(([bob, projectile]) => projectile.id === initialProjectile.id),
      projectile$.filter(({source, x, y, size}) => {
        switch (source) {
          case FROM_TOP:     return y > 100;
          case FROM_RIGHT:   return x < -size;
          case FROM_BOTTOM:  return y < -size;
          case FROM_LEFT:    return x > 100;
        }
      })
    )
      .first()
      .mapTo({id: initialProjectile.id, dead: true})
      .delay(1) //.share() on line 46 inexplicably changes order of events
                //for the second subscriber, so need to delay `dead` event
                //to make sure it will be emitted last
      .share();

    return projectile$.takeUntil(projectileDead$).merge(projectileDead$);
  }

  function getDirection({type, key, keyIdentifier}) {
    if (type !== 'keydown' && type !== 'keyup') { return; }
    let dir;
    if (key && /^Arrow(Up|Down|Left|Right)$/.test(key)) {
      dir = key.substr(5).toLowerCase();
    }
    if (keyIdentifier && ['Up', 'Down', 'Left', 'Right'].indexOf(keyIdentifier) > -1) {
      dir = keyIdentifier.toLowerCase();
    }
    return dir ? {[dir]: type === 'keydown' ? 1 : 0} : null;
  }

  function getLevelDelay(level, base) {
    if (level === 0) { return 0; }
    return getLevelDelay(level - 1, base) + Math.round(Math.pow(2, level - 1) * base);
  }
};
