'use strict';
+function(
  {Observable: $, Subject, ReplaySubject},
  {assign, keys},
  {startView, battlefieldView, finishView, headerView, latencyView, levelView},
  {UP, RIGHT, DOWN, LEFT}
){
  const KEY_DIRECTION = {
    38: UP,     //arrow up
    87: UP,     //w
    39: RIGHT,  //arrow right
    68: RIGHT,  //d
    40: DOWN,   //arrow down
    83: DOWN,   //s
    37: LEFT,   //arrow left
    65: LEFT    //a
  };

  startView().nickname$.subscribe(nickname => {
    document.getElementById('game').style.display = 'block';
    reloadOnSpace();
    restartOnEscape();

    const socket = io('/');
    const eventSubjects = ['bob$', 'time$', 'bobHp$', 'bobDead$', 'level$', 'projectile$', 'topTime$', 'result$']
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
    socket.emit('start', nickname);
    emitKeyEvents(socket);

    const {bob$, projectile$, level$, bobHp$, bobDead$, topTime$, time$, result$} = eventSubjects;
    battlefieldView(bob$, projectile$, bobHp$);
    latencyView(getLatency(socket));
    levelView(level$);
    headerView(nickname, time$, topTime$);
    finishView(time$, result$);
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
      .filter(({type, keyCode}) => ~['keydown', 'keyup'].indexOf(type) && KEY_DIRECTION[keyCode] !== undefined)
      .map(({type, keyCode}) => [type === 'keydown' ? 'move' : 'stop', KEY_DIRECTION[keyCode]])
      .subscribe(([type, direction]) => socket.emit(type, direction));
  }

  function getLatency(socket) {
    const {now} = Date;
    return $.timer(0, 1000)
      .takeUntil($.fromEvent(socket, 'disconnect'))
      .map(() => now())
      .do(() => socket.emit('pingcheck'))
      .map(then => $.fromEvent(socket, 'pongcheck').first().map(() => now() - then))
      .exhaust()
      //emit average of last 5 seconds every second
      .bufferCount(5, 1)
      .map(latencies => latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length);
  }
}(self.Rx, Object, self.Views, self.Game);


