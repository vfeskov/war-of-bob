import { Component, OnChanges, ChangeDetectionStrategy, Input, ChangeDetectorRef } from '@angular/core';
import { Observable as $ } from 'rxjs/Observable';

@Component({
  selector: 'wob-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent implements OnChanges {
  @Input() latency$: $<number>;
  latency: number;
  showLatency: boolean;

  constructor(private cd: ChangeDetectorRef) { }

  ngOnChanges() {
    if (!this.latency$) { return; }
    this.latency$.subscribe(latency => {
      this.latency = latency;
      this.showLatency = true;
      this.cd.markForCheck();
    });
  }
}
