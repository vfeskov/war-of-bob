'use strict';
+function({assign}, {Observable: $}, target) {
  assign(target, {startView});

  function startView() {
    const placeholders = [
      'The Incredible',
      'qwerty',
      'Speedy',
      'Asthma',
      'Two Legs',
      'user6410323'
    ];

    const nicknameEl = document.getElementById('nickname');
    const startEl = document.getElementById('start');
    const buttonEl = document.getElementById('nickname-submit');

    const nicknameKeyevent$ = $.merge($.fromEvent(nicknameEl, 'keyup'), $.fromEvent(nicknameEl, 'keydown'));
    const nicknameEnter$ = nicknameKeyevent$.filter(({keyCode}) => keyCode === 13);
    const nickname$ = nicknameKeyevent$.map(ev => ev.target.textContent.trim()).startWith('');
    const submitClick$ = $.fromEvent(buttonEl, 'click');

    const submittedNickname$ = $.merge(
      $.of(localStorage.getItem('nickname')).filter(v => v),
      $.merge(nicknameEnter$, submitClick$)
        .withLatestFrom(nickname$)
        .map(([ev, nickname]) => nickname)
        .filter(v => v)
        .map(nickname => nickname.substr(0, 16))
    )
      .first()
      .share();

    $.timer(0, 3000)
      .map(i => placeholders[i % placeholders.length])
      .takeUntil(submittedNickname$)
      .subscribe(v => nicknameEl.setAttribute('placeholder', v));

    nicknameEnter$.subscribe(ev => ev.preventDefault());

    submitClick$.withLatestFrom(nickname$)
      .map(([e, nickname]) => nickname)
      .filter(v => !v)
      .takeUntil(submittedNickname$)
      .startWith('')
      .subscribe(() => setTimeout(() => nicknameEl.focus(), 0));

    submittedNickname$
      .subscribe(nickname => localStorage.setItem('nickname', nickname));

    $.of('block')
      .merge(submittedNickname$.mapTo('none'))
      .subscribe(display => startEl.style.display = display);

    return {nickname$: submittedNickname$};
  };
}(Object, Rx, self.Views = self.Views || {});
