+function({assign, keys}, {Observable: $, Subject}, target) {
  assign(target, {
    observablesFromEvents,
    emitObservables
  });

  function observablesFromEvents(socket, eventNames) {
    const disconnect$ = $.fromEvent(socket, 'disconnect');
    return eventNames.map(name => {
        event$ = $.fromEvent(socket, name)
          .merge(
            $.fromEvent(socket, `${name}E`)
              .mergeMap(error => $.throw(error))
          )
          .takeUntil(
            disconnect$
              .merge($.fromEvent(socket, `${name}C`))
          );
        return [name, event$];
      })
      .reduce((res, [name, event$]) => assign(res, {[name]: event$}), {});
  }

  function emitObservables(socket, observables) {
    keys(observables)
      .forEach(name =>
        observables[name]
          .subscribe(
            data => socket.emit(name, data),
            data => socket.emit(`${name}E`, data),
            data => socket.emit(`${name}C`)
          )
      );
  }
}(
  Object,
  ...(typeof module === 'undefined' ?
    [self.Rx, self.SocketUtil = {}] :
    [require('rxjs'), module.exports])
);
