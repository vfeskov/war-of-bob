import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/takeUntil';
import {Observable as $} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

export {
  observablesFromEvents,
  emitObservables
};

const {assign, keys} = Object;

function observablesFromEvents(socket, eventNames) {
  return eventNames.map(name => {
      const event$ = $.fromEvent(socket, name)
        .merge(
          $.fromEvent(socket, `${name}E`)
            .mergeMap(error => $.throw(error))
        )
        .takeUntil($.merge(
          $.fromEvent(socket, 'disconnect'),
          $.fromEvent(socket, `${name}C`)
        ));
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
