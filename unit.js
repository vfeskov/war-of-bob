class Unit {
  constructor(width) {
    this.size = width;
    this.dead$ = this.getDead$ ? this.getDead$() : new Rx.Subject();

    const validateCoordinate = coord$ =>
      coord$
        .takeUntil(this.dead$)
        .scan((sum, v) => {
          sum += v;
          if (sum > 100 - this.size) {
            return 100 - this.size;
          } else if (sum < 0) {
            return 0;
          }
          return sum;
        })
        .share();

    this.x$ = new Rx.Subject().let(validateCoordinate);
    this.y$ = new Rx.Subject().let(validateCoordinate);
  }
}
