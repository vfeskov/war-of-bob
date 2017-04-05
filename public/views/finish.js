+function() {
  self.FinishView = {
    init(time$, result$) {
      const containerEl = document.getElementById('finish');
      const highscoreEl = document.getElementById('finish-highscore');
      const timeEl = document.getElementById('finish-time');
      const leaderboardEl = document.getElementById('finish-leaderboard');

      time$.last().subscribe(time => {
        containerEl.style.display = 'flex';
        timeEl.appendChild(document.createTextNode(formatTime(time)))
      });

      result$
        .map(r => r.topTime)
        .combineLatest(time$.last())
        .filter(([topTime, time]) => time >= topTime)
        .subscribe(() => highscoreEl.style.display = 'block')

      result$.subscribe(({leaderboard, place}) => {
        leaderboard.forEach(({name, time}, index) => {
          const li = document.createElement('li');
          if (index === place) { li.className += 'active'; }
          li.appendChild(document.createTextNode(`${name} ${formatTime(time)}`));
          leaderboardEl.appendChild(li);
        });
      });
    }
  };

  function formatTime(time) {
    return time.toString().replace(/(\d)$/, '.$1');
  }
}();
