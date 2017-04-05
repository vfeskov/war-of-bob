+function({Observable, Subject, ReplaySubject}, {assign}) {
  const $ = Observable;

  StartView.getNickname().subscribe(startGame);

  function startGame(nickname) {
    document.getElementById('game').style.display = 'block';

    const socket = io(':8008');
    const eventSubjects = ['state$', 'time$', 'bobHp$', 'topTime$', 'bobDead$', 'result$', 'level$']
      .map(eventName => {
        const subject = new Subject();
        subscribeSubjectToEvent(subject, eventName, socket);
        return [eventName, subject];
      })
      .reduce((res, [eventName, subject]) => assign(res, {[eventName]: subject}), {});
    socket.on('disconnect', () =>
      Object.keys(eventSubjects).forEach(id => eventSubjects[id].complete())
    );
    emitKeyEvents(html, socket);
    monitorLatency(socket);

    const {state$, bobHp$, time$, topTime$, result$, level$} = eventSubjects;
    const battlefieldView = new BattlefieldView(state$, bobHp$, level$);
    const headerView = new HeaderView(nickname, time$, topTime$);
    FinishView.init(time$, result$);

    reloadOnSpace(html);
    logoutOnEscape(html);

    socket.emit('start', nickname);
  }

  function subscribeSubjectToEvent(subject, eventName, socket) {
    ['next', 'error', 'complete']
      .forEach(method =>
        socket.on(
          `${eventName}.${method}`,
          data => subject[method](data)
        )
      );
  }

  function reloadOnSpace(html) {
    $.fromEvent(html, 'keyup').filter(({keyCode}) => keyCode === 32)
      .subscribe(() => location.reload());
  }

  function logoutOnEscape(html) {
    $.fromEvent(html, 'keyup').filter(({keyCode}) => keyCode === 27)
      .subscribe(() => {
        localStorage.removeItem('nickname');
        location.reload();
      });
  }

  function emitKeyEvents(html, socket) {
    $.merge(
      $.fromEvent(html, 'keyup'),
      $.fromEvent(html, 'keydown')
    )
      .subscribe(({type, key, keyIdentifier}) =>
        socket.emit('keyevent', {
          type, key, keyIdentifier
        })
      );
  }

  function monitorLatency(socket) {
    $.timer(0, 1000)
      .map(() => new $(sub => {
        const then = Date.now();
        //ping and pong events are reserved and won't work as it turns out
        socket.emit('pingcheck');
        socket.on('pongcheck', () => {
          sub.next(Date.now() - then)
          sub.complete();
        });
      }))
      .exhaust()
      //emit average of last 5 seconds every second
      .bufferCount(5, 1)
      .map(latencies => latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length)
      .subscribe(console.log);
  }
}(Rx, Object);


