+function(
  {Observable: $, Subject, ReplaySubject},
  {assign, keys},
  {startView, battlefieldView, finishView, headerView, latencyView, levelView}
){
  const KEY_DIRECTION = {
    38: 'up',
    39: 'right',
    40: 'down',
    37: 'left'
  };

  startView().nickname$.subscribe(nickname => {
    document.getElementById('game').style.display = 'block';
    reloadOnSpace();
    restartOnEscape();

    const socket = io(':8008');
    const eventSubjects =
      [
        'bob$',
        'projectile$',
        'time$',
        'bobHp$',
        'topTime$',
        'bobDead$',
        'result$',
        'level$'
      ]
      .map(name => {
        const subject = new Subject();
        ['next', 'error', 'complete'].forEach(method =>
          socket.on(`${name}.${method}`, data => subject[method](data))
        );
        return [name, subject];
      })
      .reduce((res, [name, subject]) => assign(res, {[name]: subject}), {});
    socket.on('disconnect', () =>
      keys(eventSubjects).forEach(id => eventSubjects[id].complete())
    );
    emitKeyEvents(socket);

    const {bob$, projectile$, bobHp$, time$, topTime$, result$, level$} = eventSubjects;

    battlefieldView(bob$, projectile$, bobHp$);
    latencyView(getLatency(socket));
    levelView(level$);
    headerView(nickname, time$, topTime$);
    finishView(time$, result$);

    socket.emit('start', nickname);
  });

  function reloadOnSpace() {
    $.fromEvent(document.body, 'keyup')
      .filter(({keyCode}) => keyCode === 32)
      .subscribe(() => location.reload());
  }

  function restartOnEscape() {
    $.fromEvent(document.body, 'keyup')
      .filter(({keyCode}) => keyCode === 27)
      .subscribe(() => {
        localStorage.removeItem('nickname');
        location.reload();
      });
  }

  function emitKeyEvents(socket) {
    $.fromEvent(document.body, 'keydown')
      .merge($.fromEvent(document.body, 'keyup'))
      .filter(({type, keyCode}) => ~['keydown', 'keyup'].indexOf(type) && KEY_DIRECTION[keyCode])
      .map(({type, keyCode}) => [type === 'keydown' ? 'move' : 'stop', KEY_DIRECTION[keyCode]])
      .subscribe(([type, direction]) =>
        socket.emit(type, direction)
      );
  }

  function getLatency(socket) {
    return $.timer(0, 1000)
      .takeUntil($.fromEvent(socket, 'disconnect'))
      .map(() => new $(sub => {
        const then = Date.now();
        socket.emit('pingcheck');
        socket.on('pongcheck', () => {
          sub.next(Date.now() - then)
          sub.complete();
        });
      }))
      .exhaust()
      //emit average of last 5 seconds every second
      .bufferCount(5, 1)
      .map(latencies => latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length);
  }
}(Rx, Object, self);


