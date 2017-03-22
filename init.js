+function() {
  const bob = new Bob(6);
  const battlefield = new Battlefield(bob);
  const timer = new Timer(bob);

  const singletons = {bob, battlefield, timer};

  //const battlefieldView = new BattlefieldView(singletons);
  const battlefieldCanvasView = new BattlefieldCanvasView(singletons);
  const healthbarView = new HealthbarView(singletons);
  const timerView = new TimerView(singletons);
  const finishView = new FinishView(singletons);

  bob.init();

  Rx.Observable.fromEvent(document.getElementById('html'), 'keyup')
    .filter(({key, keyIdentifier}) =>
      keyIdentifier === 'U+0020' || key === ' '
    )
    .subscribe(() => location.reload());
}();


