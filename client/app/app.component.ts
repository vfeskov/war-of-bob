import { Component, OnInit } from '@angular/core';
import {Observable as $} from 'rxjs/Observable';
import * as io from 'socket.io-client/dist/socket.io.min.js';
import {Subject} from 'rxjs/Subject';
import {startView} from './views/start';
import {battlefieldView} from './views/battlefield';
import {finishView} from './views/finish';
import {headerView} from './views/header';
import {latencyView} from './views/latency';
import {levelView} from './views/level';
import {UP, RIGHT, DOWN, LEFT} from '../../shared/game';
import {emitObservables, observablesFromEvents} from '../../shared/socket-util';
import { environment } from '../environments/environment';

@Component({
  selector: 'wob-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  ngOnInit() {
    const {assign, keys} = Object;

    startView().nickname$.subscribe(nickname => {
      document.getElementById('game').style.display = 'block';

      reloadOnSpace();
      restartOnEscape();
      const server = io(environment.serverUrl);

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

    function getBobsMovement() {
      const KEY_DIRECTION = {
        38: UP,     // arrow up
        87: UP,     // w
        39: RIGHT,  // arrow right
        68: RIGHT,  // d
        40: DOWN,   // arrow down
        83: DOWN,   // s
        37: LEFT,   // arrow left
        65: LEFT    // a
      };
      const movement$ = $.fromEvent(document.body, 'keydown')
        .merge($.fromEvent(document.body, 'keyup'))
        .filter(({type, keyCode}) => ['keydown', 'keyup'].indexOf(type) > -1 && KEY_DIRECTION[keyCode] !== undefined)
        .map(({type, keyCode}) => [type === 'keydown' ? 'move' : 'stop', KEY_DIRECTION[keyCode]])
        .share();
      const move$ = movement$.filter(([t]) => t === 'move').map(([t, d]) => d);
      const stop$ = movement$.filter(([t]) => t === 'stop').map(([t, d]) => d);
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
        // emit average of last 5 seconds every second
        .bufferCount(5, 1)
        .map((latencies: any) => latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length)
        .map(Math.round);
    }
  }
}
