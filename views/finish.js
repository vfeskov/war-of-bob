class FinishView {
  constructor(time$, highscore$) {
    this.createElements();

    time$.last().subscribe(time => {
      this.container.style.display = 'flex';
      this.time.appendChild(document.createTextNode(this.formatTime(time)))
    });

    highscore$.skip(1).subscribe(time =>
      this.highscore.style.display = 'block'
    );
  }

  createElements() {
    this.container = document.createElement('finish');

    this.title = document.createElement('h1');
    this.title.appendChild(document.createTextNode('WAR OF BOB'));

    this.highscore = document.createElement('highscore');
    this.highscore.appendChild(document.createTextNode('New Highscore!'));

    this.timeContainer = document.createElement('time-container');
    this.time = document.createElement('time');
    this.timeContainer.appendChild(document.createTextNode('You survived '));
    this.timeContainer.appendChild(this.time);
    this.timeContainer.appendChild(document.createTextNode(' seconds. '));
    this.timeContainer.appendChild(document.createElement('br'));
    this.timeContainer.appendChild(document.createTextNode('Hit Space to restart.'));

    this.container.appendChild(this.title);
    this.container.appendChild(this.highscore);
    this.container.appendChild(this.timeContainer);
    document.body.appendChild(this.container);
  }

  formatTime(time) {
    return time.toString().replace(/(\d\d)$/, '.$1');
  }
}
