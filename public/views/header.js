self.headerView = function() {
  return (name, time$, topTime$) => {
    const timeContainer = document.getElementById('time');
    const topTimeContainer = document.getElementById('top-time');
    const levelContainer = document.getElementById('level');

    document.getElementById('header-nickname').appendChild(document.createTextNode(name));

    var finished = false, time = 0;
    time$.subscribe(_time => time = _time, 0, () => finished = true);

    topTime$.subscribe(topTime => updateTime(topTimeContainer, topTime));

    (function render() {
      requestAnimationFrame(() => {
        updateTime(timeContainer, time);
        !finished && render();
      });
    })();
  };

  function formatTime(time) {
    return time.toString().replace(/(\d)$/, '.$1s');
  }

  function updateTime(container, time) {
    time && updateText(container, formatTime(time));
  }

  function updateText(container, text) {
    const prevChild = container.firstChild;
    prevChild && container.removeChild(prevChild);
    container.appendChild(document.createTextNode(text));
  }
}();
