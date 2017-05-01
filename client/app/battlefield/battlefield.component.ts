import { Component, OnInit, ChangeDetectionStrategy, Input, ViewChild, ElementRef } from '@angular/core';
import { Observable as $ } from 'rxjs/Observable';
import {
  moveProjectile, BOB, BULLET, FOOD, FROM_TOP, FROM_RIGHT, FROM_BOTTOM, FROM_LEFT
} from '../../../shared/game';
import { BattlefieldService, CANVAS_SIZE } from '../battlefield.service';

const {keys, assign} = Object;

@Component({
  selector: 'wob-battlefield',
  templateUrl: './battlefield.component.html',
  styleUrls: ['./battlefield.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BattlefieldComponent implements OnInit {
  @Input() bob$: $<any>;
  @Input() projectile$: $<any>;
  @Input() bobHp$: $<any>;
  @Input() level$: $<any>;
  @ViewChild('canvas') canvasChild;
  private prevState = {};
  private state = {};
  private finished: boolean = false;
  private bobHp: number;
  private images = {};
  private imageData = {};
  private host: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(
    private elementRef: ElementRef,
    private battlefieldService: BattlefieldService
  ) { }

  ngOnInit() {
    this.host = this.elementRef.nativeElement;
    this.canvas = this.canvasChild.nativeElement;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = CANVAS_SIZE;
    this.canvas.height = CANVAS_SIZE;
    this.updateCanvasSize();
    window.onresize = () => this.updateCanvasSize();

    const projectile$ = this.projectile$
      .filter(p => !p.dead)
      .mergeMap(projectile => {
        const {id, speed} = projectile;
        const dead$ = this.projectile$.filter(p => p.id === id && p.dead);
        return $.interval(speed)
          .startWith(projectile)
          .scan(moveProjectile)
          .takeUntil(dead$)
          .merge(dead$);
      });
    const bob$ = this.bob$.map(bob => assign(bob, {type: BOB}));
    $.merge(bob$, projectile$)
      .scan((_state, {id, type, source, size, x, y, dead}) => {
        const newState = assign({}, _state);
        if (dead) {
          delete newState[id];
        } else {
          newState[id] = {id, type, source, size, x, y};
        }
        return newState;
      }, {})
      .subscribe(state => this.state = state, () => {}, () => this.finished = true);

    this.bobHp$.subscribe(bobHp => this.bobHp = bobHp);

    this.battlefieldService.loadImages()
      .then(() => this.render());
  }

  render() {
    requestAnimationFrame(() => {
      keys(this.prevState)
        .map(key => this.prevState[key])
        .forEach(({size, x, y}) =>
          this.ctx.clearRect(pxls(x), pxls(y), pxls(size), pxls(size))
        );

      keys(this.state)
        .map(key => this.state[key])
        .forEach(({type, source, size, x, y}) => {
          const data = this.battlefieldService.getImageData(type, source, size);
          if (data) { this.ctx.putImageData(data, pxls(x), pxls(y)); }
          if (type === BOB) { this.renderHealthbar(this.ctx, x, y, size, this.bobHp); }
        });

      this.prevState = this.state;
      if (!this.finished) { this.render(); }
    });
  }

  updateCanvasSize() {
    const scale = (this.host.offsetWidth - 2) / CANVAS_SIZE;
    this.canvas.style.transformOrigin = '0 0';
    this.canvas.style.transform = `scale(${scale})`;
  }

  renderHealthbar(ctx, x, y, size, hp) {
    const line = (xPxls1, xPxls2, color) => {
      ctx.beginPath();
      ctx.moveTo(xPxls1, pxls(y + size - 0.5));
      ctx.lineTo(xPxls2, pxls(y + size - 0.5));
      ctx.lineWidth = pxls(1);
      ctx.strokeStyle = color;
      ctx.stroke();
    };
    if (hp > 0) { line(pxls(x), pxls(x + size * hp / 6), '#55ba6a'); }
    line(pxls(x + size * hp / 6), pxls(x + size), '#fc6e51');
  }
}

export function pxls(prcnt) {
  return Math.round(prcnt * CANVAS_SIZE / 100);
}
