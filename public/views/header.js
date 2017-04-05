class HeaderView {
  constructor(name, time$, topTime$) {
    this.timeContainer = document.getElementById('time');
    this.topTimeContainer = document.getElementById('top-time');
    this.levelContainer = document.getElementById('level');

    document.getElementById('header-nickname').appendChild(document.createTextNode(name));

    time$.distinctUntilChanged().subscribe(time => this.time = time, 0, () => this.finished = true);

    topTime$.subscribe(topTime => this.updateTime(this.topTimeContainer, topTime));

    this.render();
  }

  render() {
    requestAnimationFrame(() => {
      this.updateTime(this.timeContainer, this.time);
      !this.finished && this.render();
    });
  }

  formatTime(time) {
    return time.toString().replace(/(\d)$/, '.$1s');
  }

  updateTime(container, time) {
    time && this.updateText(container, this.formatTime(time));
  }

  updateText(container, text) {
    const prevChild = container.firstChild;
    prevChild && container.removeChild(prevChild);
    container.appendChild(document.createTextNode(text));
  }
}
