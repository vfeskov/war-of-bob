+function({Observable, Subject, ReplaySubject}, {assign}) {

  const state$ = new Subject();
  const bobHp$ = new Subject();
  const bobDead$ = new Subject();
  const time$ = new Subject().takeUntil(bobDead$);

  const socket = io(':8008');
  socket.on('state', data => state$.next(data));
  socket.on('time', data => time$.next(data));
  socket.on('bobHp', data => bobHp$.next(data));
  socket.on('bobDead', data => bobDead$.next());
  socket.on('disconnect', () => [state$, bobHp$, bobDead$, time$].forEach(s => s.complete()));

  Observable.fromEvent(html, 'keyup').filter(({key, keyIdentifier}) =>
    keyIdentifier === 'U+0020' || key === ' '
  )
    .subscribe(() => location.reload());

  Observable.merge(
    Observable.fromEvent(html, 'keyup'),
    Observable.fromEvent(html, 'keydown')
  )
    .subscribe(({type, key, keyIdentifier}) =>
      socket.emit('keyevent', {
        type, key, keyIdentifier
      })
    );

  const prevHighscore = localStorage.getItem('highscore');

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


