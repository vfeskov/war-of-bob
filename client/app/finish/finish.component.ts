import { Component, OnChanges, ChangeDetectionStrategy, Input } from '@angular/core';
import { Observable as $ } from 'rxjs/Observable';

@Component({
  selector: 'wob-finish',
  templateUrl: './finish.component.html',
  styleUrls: ['./finish.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinishComponent implements OnChanges {
  @Input() time: number;
  @Input() result: any;
  timeFormatted: string;
  highscore = false;

  constructor() { }

  ngOnChanges() {
    this.timeFormatted = this.time ? this.formatTime(this.time) : '0';
    this.highscore = this.result && this.time >= this.result.topTime;
  }

  formatTime(time) {
    return time.toString().replace(/(\d\d)\d$/, '.$1');
  }
}
