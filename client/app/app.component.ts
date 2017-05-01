import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Observable as $ } from 'rxjs/Observable';
import * as io from 'socket.io-client/dist/socket.io.min.js';
import { Subject } from 'rxjs/Subject';
import { UP, RIGHT, DOWN, LEFT } from '../../shared/game';
import { emitObservables, observablesFromEvents } from '../../shared/socket-util';
import { environment } from '../environments/environment';
import { BattlefieldService } from './battlefield.service';

const {assign, keys} = Object;

@Component({
  selector: 'wob-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  private nickname: string;
  private time$: $<number>;
  private topTime: $<number>;
  private latency$: $<number>;
  private bob$: $<any>;
  private bobHp$: $<number>;
  private bobDead$: $<any>;
  private level$: $<number>;
  private result$: $<any>;
  private result: number;
  private finalTime: number;

  constructor(
    private battlefieldService: BattlefieldService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.battlefieldService.loadImages();

    this.nickname = localStorage.getItem('nickname');
    if (this.nickname) { this.start(); }
  }

  setNickname(nickname: string) {
    localStorage.setItem('nickname', nickname);
    this.nickname = nickname;
    this.start();
  }

  start() {
    this.reloadOnSpace();
    this.restartOnEscape();

    const server = io(environment.serverUrl);

    const {move$, stop$} = this.getBobsMovement();
    emitObservables(server, {move$, stop$});

    assign(this, observablesFromEvents(server, [
      'bob$',
      'projectile$',
      'time$',
      'bobHp$',
      'bobDead$',
      'result$',
      'topTime$',
      'level$'
    ]));

    this.latency$ = this.getLatency(server);

    server.emit('start', this.nickname);

    this.result$.subscribe(result => {
      this.result = result;
      this.cd.markForCheck();
    });
    this.time$.last().subscribe(finalTime => {
      this.finalTime = finalTime;
      this.cd.markForCheck();
    });
  }

  reloadOnSpace() {
    $.fromEvent(document.body, 'keyup')
      .filter(({keyCode}) => keyCode === 32)
      .subscribe(() => location.reload());
  }

  restartOnEscape() {
    $.fromEvent(document.body, 'keyup')
      .filter(({keyCode}) => keyCode === 27)
      .subscribe(() => {
        localStorage.removeItem('nickname');
        location.reload();
      });
  }

  getBobsMovement() {
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

  getLatency(server) {
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
