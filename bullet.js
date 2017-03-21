class Bullet extends Unit {
  constructor() {
    const size = Math.floor(Math.random() * 3) * 2 + 2;
    super(size);
    this.source = Math.floor(Math.random() * 4);
  }

  init() {
    const offset = Math.floor(Math.random() * (101 - this.size));

    switch (this.source) {
      case Bullet.FROM_TOP:
        this.x$.next(offset);
        this.y$.next(0);
        break;
      case Bullet.FROM_RIGHT:
        this.x$.next(100 - this.size);
        this.y$.next(offset);
        break;
      case Bullet.FROM_BOTTOM:
        this.x$.next(offset);
        this.y$.next(100 - this.size);
        break;
      case Bullet.FROM_LEFT:
        this.x$.next(0);
        this.y$.next(offset);
        break;
    }

    this.intervalId = setInterval(() => this.move(), 25);
    this.scheduleDeath();
  }

  move() {
    switch (this.source) {
      case Bullet.FROM_TOP:
        this.y$.next(1); break;
      case Bullet.FROM_RIGHT:
        this.x$.next(-1); break;
      case Bullet.FROM_BOTTOM:
        this.y$.next(-1); break;
      case Bullet.FROM_LEFT:
        this.x$.next(1); break;
    }
  }

  scheduleDeath() {
    let death$;
    switch (this.source) {
      case Bullet.FROM_TOP:
        death$ = this.y$.filter(y => y === 100 - this.size);
        break;
      case Bullet.FROM_RIGHT:
        death$ = this.x$.filter(x => x === 0);
        break;
      case Bullet.FROM_BOTTOM:
        death$ = this.y$.filter(y => y === 0);
        break;
      case Bullet.FROM_LEFT:
        death$ = this.x$.filter(x => x === 100 - this.size);
        break;
    }
    death$.subscribe(() => this.die());
  }

  die() {
    this.dead$.next();
    this.dead$.complete();
    clearInterval(this.intervalId);
  }
}

Bullet.FROM_TOP = 0;
Bullet.FROM_RIGHT = 1;
Bullet.FROM_BOTTOM = 2;
Bullet.FROM_LEFT = 3;
