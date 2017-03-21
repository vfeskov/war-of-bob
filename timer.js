class Timer {
  constructor(bob) {
    this.time$ = Rx.Observable.timer(0, 10)
      .takeUntil(bob.dead$)
      .scan(time => time + 1)
      .share();

    const initHighscore = localStorage.getItem('highscore');

    this.highscore$ = this.time$
      .last()
      .filter(time => time > initHighscore)
      .startWith(initHighscore)
      .publishReplay(1).refCount();

    this.highscore$.skip(1).subscribe(v => localStorage.setItem('highscore', v));
  }
}
