class TimerView {
  constructor(time$, highscore$) {
    this.container = document.getElementById('timer');
    this.timeContainer = document.createElement('time');
    this.highscoreContainer = document.createElement('highscore');
    this.container.appendChild(this.timeContainer);
    this.container.appendChild(this.highscoreContainer);

    time$.subscribe(time => this.time = time);

    highscore$.subscribe(highscore => this.updateTime(this.highscoreContainer, highscore));

    this.render();
  }

  render() {
    requestAnimationFrame(() => {
      this.updateTime(this.timeContainer, this.time);
      this.render();
    });
  }

  formatTime(time) {
    return time.toString().replace(/(\d)$/, '.$1s');
  }

  updateTime(container, time) {
    const prevChild = container.firstChild;
    prevChild && container.removeChild(prevChild);
    time && container.appendChild(document.createTextNode(this.formatTime(time)));
  }
}
