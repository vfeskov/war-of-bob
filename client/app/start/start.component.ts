import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, ViewChild } from '@angular/core';
import { Observable as $ } from 'rxjs/Observable';
import { async } from 'rxjs/scheduler/async';

const PLACEHOLDERS = [
  'The Incredible',
  'qwerty',
  'Speedy',
  'Asthma',
  'Two Legs',
  'user6410323'
];

@Component({
  selector: 'wob-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StartComponent implements OnInit {
  @Output() nickname: EventEmitter<string> = new EventEmitter();
  @ViewChild('inputField') inputField;
  @ViewChild('submitButton') submitButton;
  placeholder$: $<string>;

  ngOnInit() {
    const inputFieldEl = this.inputField.nativeElement;
    const submitButtonEl = this.submitButton.nativeElement;

    this.placeholder$ = $.timer(0, 3000)
      .map(i => PLACEHOLDERS[i % PLACEHOLDERS.length]);

    const nicknameKeyevent$ = $.merge(
        $.fromEvent(inputFieldEl, 'keyup'),
        $.fromEvent(inputFieldEl, 'keydown')
      ),

      nicknameEnter$ = nicknameKeyevent$
        .filter(({keyCode}) => keyCode === 13),

      nickname$ = nicknameKeyevent$
        .map((ev: any) => ev.target.textContent.trim())
        .startWith(''),

      submitClick$ = $.fromEvent(submitButtonEl, 'click'),

      submittedNickname$ = $.merge(nicknameEnter$, submitClick$)
        .withLatestFrom(nickname$)
        .map(([ev, nickname]) => nickname)
        .filter(v => v)
        .map(nickname => nickname.substr(0, 16))
        .first(),

      inputFocus$ = submitClick$.withLatestFrom(nickname$)
        .map(([e, nickname]) => nickname)
        .filter(v => !v)
        .takeUntil(submittedNickname$)
        .startWith('')
        .subscribeOn(async);

    nicknameEnter$.subscribe((ev: any) => ev.preventDefault());
    inputFocus$.subscribe(() => inputFieldEl.focus());
    submittedNickname$.subscribe(this.nickname);
  }

}
