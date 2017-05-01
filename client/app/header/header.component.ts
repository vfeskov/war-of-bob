import { Component, OnInit, ChangeDetectionStrategy, Input, ViewChild } from '@angular/core';
import { Observable as $ } from 'rxjs/Observable';

@Component({
  selector: 'wob-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {
  @Input() nickname: string;
  @Input() time$: $<number>;
  @Input('topTime$') origTopTime$: $<number>;
  @ViewChild('time') childTime;
  private topTime$: $<string>;
  private time: number = 0;
  private finished: boolean = false;
  private timeEl: HTMLElement;

  constructor() { }

  ngOnInit() {
    this.topTime$ = this.origTopTime$.map(this.formatTime);
    this.timeEl = this.childTime.nativeElement;
    this.time$
      .switchMap(_time => $.timer(0, 10).map(t => _time + t * 10))
      .takeUntil(this.time$.last())
      .merge(this.time$.last())
      .subscribe(time => this.time = time, () => {}, () => this.finished = true);
    this.renderTime();
  }

  renderTime() {
    requestAnimationFrame(() => {
      const prevChild = this.timeEl.firstChild;
      if (prevChild) { this.timeEl.removeChild(prevChild); }
      this.timeEl.appendChild(document.createTextNode(this.formatTime(this.time)));
      if (!this.finished) { this.renderTime(); }
    });
  }

  formatTime(time: number): string {
    return time.toString().replace(/(\d\d)\d$/, '.$1s');
  }
}
