+function({Observable, Subject, ReplaySubject}, {assign}) {

  const state$ = new Subject();
  const bobHp$ = new Subject();
  const bobDead$ = new Subject();
  const time$ = new Subject().takeUntil(bobDead$);

  const worker = new Worker('worker.js');
  worker.onmessage = ({data}) => {
    const [type, value] = data;
    switch (type) {
      case 'state': state$.next(value); break;
      case 'time': time$.next(value); break;
      case 'bobHp': bobHp$.next(value); break;
      case 'bobDead': bobDead$.next(); break;
    }
  };

  Observable.fromEvent(html, 'keyup').filter(({key, keyIdentifier}) =>
    keyIdentifier === 'U+0020' || key === ' '
  )
    .subscribe(() => location.reload());

  Observable.merge(
    Observable.fromEvent(html, 'keyup'),
    Observable.fromEvent(html, 'keydown')
  )
    .subscribe(({type, key, keyIdentifier}) =>
      worker.postMessage({
        type, key, keyIdentifier
      })
    );

  const prevHighscore = localStorage.getItem('highscore')

  highscore$ = time$
    .last()
    .filter(time => time > prevHighscore)
    .startWith(prevHighscore)
    .publishReplay(1)
    .refCount();

  highscore$.skip(1).subscribe(highscore =>
    localStorage.setItem('highscore', highscore)
  );

  const battlefieldView = new BattlefieldView(state$);
  //const battlefieldView = new BattlefieldDOMView(state$);
  const healthbarView = new HealthbarView(bobHp$);
  const timerView = new TimerView(time$, highscore$);
  const finishView = new FinishView(time$, highscore$);

}(Rx, Object);


