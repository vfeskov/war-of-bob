export {levelView};

function levelView(level$) {
  const levelEl = document.getElementById('level');
  level$.subscribe(level => {
    if (levelEl.firstChild) { levelEl.removeChild(levelEl.firstChild); }
    levelEl.appendChild(document.createTextNode(level + 1));
  });
};
