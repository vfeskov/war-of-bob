class Bob extends Unit {
  getDead$() {
    this.health$ = new Rx.Subject()
      .scan((sum, v) => {
        sum += v;
        return sum < 0 ? 0 : sum;
      })
      .share();
    return this.health$
      .filter(health => health === 0)
      .first();
  }

  init() {
    const initCoord = 50 - Math.round(this.size / 2);
    this.x$.next(initCoord);
    this.y$.next(initCoord);
    this.health$.next(100);

    const html = document.getElementById('html');
    const move$ = Rx.Observable.fromEvent(html, 'keydown')
      .map(ev => this.getDirection(ev))
      .filter(dir => dir)
      .map(dir => ({[dir]: 1}));
    const stop$ = Rx.Observable.fromEvent(html, 'keyup')
      .map(ev => this.getDirection(ev))
      .filter(dir => dir)
      .map(dir => ({[dir]: 0}));

    Rx.Observable.merge(move$, stop$)
      .takeUntil(this.dead$)
      .scan((dirs, dir) => Object.assign(dirs, dir))
      .distinct(dirs => JSON.stringify(dirs))
      .filter(({up, right, down, left}) => up || right || down || left)
      .switchMap(dirs => Rx.Observable.timer(0, 25).mapTo(dirs))
      .subscribe(dirs =>
        Object.keys(dirs)
          .filter(dir => dirs[dir])
          .forEach(dir => this.move(dir))
      );
  }

  getDirection(ev) {
    if (ev.key && /^Arrow(Up|Down|Left|Right)$/.test(ev.key)) {
      return ev.key.substr(5).toLowerCase();
    }
    if (ev.keyIdentifier && ['Up', 'Down', 'Left', 'Right'].indexOf(ev.keyIdentifier) > -1) {
      return ev.keyIdentifier.toLowerCase();
    }
    return null;
  }

  move(direction) {
    switch (direction) {
      case 'left':
        this.x$.next(-1); break;
      case 'right':
        this.x$.next(1); break;
      case 'down':
        this.y$.next(1); break;
      case 'up':
        this.y$.next(-1); break;
    }
  }

  hit() {
    this.health$.next(-20);
  }
}
