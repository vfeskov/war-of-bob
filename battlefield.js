class Battlefield {
  constructor(bob) {
    this.bob = bob;
    this.bobXY$ = bob.x$.combineLatest(bob.y$)
      .publishReplay(1);
    this.sub = this.bobXY$.connect();

    this.bullet$ = new Rx.Observable(sub => {
      let timeout = null;
      (function schedule() {
        timeout = setTimeout(
          () => {
            const bullet = new Bullet();
            sub.next(bullet);
            bullet.init();
            schedule();
          },
          Math.random() * 200 + 50
        );
      })();
      return () => clearTimeout(timeout);
    }).takeUntil(bob.dead$).share();

    //bullets that hit bob
    this.bullet$
      .mergeMap(bullet => {
        const bulletXY$ = bullet.x$.combineLatest(bullet.y$);
        return this.bobXY$.combineLatest(bulletXY$)
          .takeUntil(bullet.dead$)
          .filter(([[bobX, bobY], [bulletX, bulletY]]) =>
            (bulletX + bullet.size - 1) >= bobX &&
            bulletX < bobX + this.bob.size &&
            (bulletY + bullet.size - 1) >= bobY &&
            bulletY < bobY + this.bob.size
          )
          .mapTo(bullet);
      })
      .takeUntil(bob.dead$)
      .subscribe(bullet => {
        bob.hit();
        bullet.die();
      });

    const bulletEvent$ = this.bullet$.mergeMap(bullet =>
      this.getUnitEvent$(bullet, 'bullet')
    );
    const bobEvent$ = this.getUnitEvent$(bob, 'bob');

    this.state$ = Rx.Observable.merge(bulletEvent$, bobEvent$)
      .scan((state, {id, type, source, size, x, y, dead}) => {
        const newState = Object.assign({}, state);
        if (dead) {
          delete newState[id];
        } else {
          newState[id] = {id, type, source, size, x, y};
        }
        return newState;
      }, {});
  }

  getUnitEvent$(unit, type) {
    return Rx.Observable.merge(
      unit.dead$.mapTo({dead: true}),
      unit.x$.combineLatest(unit.y$).map(([x, y]) => (
        {type, source: unit.source, size: unit.size, x, y}
      ))
    ).map(ev => Object.assign(ev, {id: unit.id}))
  }
}
