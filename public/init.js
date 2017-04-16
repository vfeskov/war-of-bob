'use strict';
+function(
  {Observable: $},
  {assign, keys},
  {startView, battlefieldView, finishView, headerView, latencyView, levelView},
  {UP, RIGHT, DOWN, LEFT},
  {observablesFromEvents, emitObservables}
){
  startView().nickname$.subscribe(nickname => {
    document.getElementById('game').style.display = 'block';

    reloadOnSpace();
    restartOnEscape();

    const server = io('/');

    const {move$, stop$} = getBobsMovement();
    emitObservables(server, {move$, stop$});

    const o = observablesFromEvents(server, [
      'bob$',
      'projectile$',
      'time$',
      'bobHp$',
      'bobDead$',
      'result$',
      'topTime$',
      'level$'
    ]);

    battlefieldView(o.bob$, o.projectile$, o.bobHp$);
    latencyView(getLatency(server));
    levelView(o.level$);
    headerView(nickname, o.time$, o.topTime$);
    finishView(o.time$, o.result$);

    server.emit('start', nickname);
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

  function getBobsMovement(server) {
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
    const movement$ = $.fromEvent(document.body, 'keydown')
      .merge($.fromEvent(document.body, 'keyup'))
      .filter(({type, keyCode}) => ~['keydown', 'keyup'].indexOf(type) && KEY_DIRECTION[keyCode] !== undefined)
      .map(({type, keyCode}) => [type === 'keydown' ? 'move' : 'stop', KEY_DIRECTION[keyCode]])
      .share();
    const move$ = movement$.filter(([t]) => t === 'move').map(([t, d]) => d)
    const stop$ = movement$.filter(([t]) => t === 'stop').map(([t, d]) => d)
    return {move$, stop$};
  }

  function getLatency(server) {
    const {now} = Date;
    return $.timer(0, 1000)
      .takeUntil($.fromEvent(server, 'disconnect'))
      .map(() => now())
      .do(() => server.emit('pingcheck'))
      .map(then => $.fromEvent(server, 'pongcheck').first().map(() => now() - then))
      .exhaust()
      //emit average of last 5 seconds every second
      .bufferCount(5, 1)
      .map(latencies => latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length)
      .map(Math.round);
  }
}(self.Rx, Object, self.Views, self.Game, self.SocketUtil);


