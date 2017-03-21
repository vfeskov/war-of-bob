class TimerView {
  constructor({timer}) {
    this.container = document.getElementById('timer');
    this.timeContainer = document.createElement('time');
    this.highscoreContainer = document.createElement('highscore');
    this.container.appendChild(this.timeContainer);
    this.container.appendChild(this.highscoreContainer);

    timer.time$.subscribe(time => this.updateTime(this.timeContainer, time));

    timer.highscore$.filter(v => v).subscribe(highscore =>
      this.updateTime(this.highscoreContainer, highscore)
    );
  }

  formatTime(time) {
    return time.toString().replace(/(\d\d)$/, '.$1s');
  }

  updateTime(container, time) {
    const prevChild = container.firstChild;
    prevChild && container.removeChild(prevChild);
    container.appendChild(document.createTextNode(this.formatTime(time)));
  }
}
