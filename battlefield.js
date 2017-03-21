class Battlefield {
  constructor(bob) {
    this.bob = bob;
    this.bobXY$ = bob.x$.combineLatest(bob.y$)
      .publishReplay(1);
    this.sub = this.bobXY$.connect();

    Rx.Observable.fromEvent(document.getElementById('html'), 'keyup')
      .filter(({key, keyIdentifier}) =>
        keyIdentifier === 'U+0020' || key === ' '
      )
      .subscribe(() => location.reload());

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
        this.bob.hit();
        bullet.die();
      });
  }
}
