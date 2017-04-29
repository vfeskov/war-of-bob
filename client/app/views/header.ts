import {Observable as $} from 'rxjs/Observable';

export {headerView};

function headerView(name, time$, topTime$) {
  const timeContainer = document.getElementById('time');
  const topTimeContainer = document.getElementById('top-time');

  document.getElementById('header-nickname').appendChild(document.createTextNode(name));

  let finished = false, time = 0;
  time$
    .startWith(0)
    .switchMap(_time => $.timer(0, 10).map(t => _time + t * 10))
    .takeUntil(time$.last())
    .subscribe(_time => time = _time);

  time$.last().subscribe(_time => { time = _time; finished = true; });

  topTime$.subscribe(topTime => updateTime(topTimeContainer, topTime));

  (function render() {
    requestAnimationFrame(() => {
      updateTime(timeContainer, time);
      if (!finished) { render(); }
    });
  })();
};

function formatTime(time) {
  return time.toString().replace(/(\d\d)\d$/, '.$1s');
}

function updateTime(container, time) {
  if (time) { updateText(container, formatTime(time)); }
}

function updateText(container, text) {
  const prevChild = container.firstChild;
  if (prevChild) { container.removeChild(prevChild); }
  container.appendChild(document.createTextNode(text));
}
