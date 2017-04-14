'use strict';
+function({assign}, {Observable: $}, target) {
  assign(target, {headerView});

  function headerView(name, time$, topTime$) {
    const timeContainer = document.getElementById('time');
    const topTimeContainer = document.getElementById('top-time');

    document.getElementById('header-nickname').appendChild(document.createTextNode(name));

    var finished = false, time = 0;
    time$
      .startWith(0)
      .switchMap(time => $.timer(0, 10).map(t => time + t * 10))
      .takeUntil(time$.last())
      .subscribe(_time => time = _time);

    time$.last().subscribe(_time => { time = _time; finished = true; });

    topTime$.subscribe(topTime => updateTime(topTimeContainer, topTime));

    (function render() {
      requestAnimationFrame(() => {
        updateTime(timeContainer, time);
        !finished && render();
      });
    })();
  };

  function formatTime(time) {
    return time.toString().replace(/(\d\d)\d$/, '.$1s');
  }

  function updateTime(container, time) {
    time && updateText(container, formatTime(time));
  }

  function updateText(container, text) {
    const prevChild = container.firstChild;
    prevChild && container.removeChild(prevChild);
    container.appendChild(document.createTextNode(text));
  }
}(Object, self.Rx, self.Views = self.Views || {});
