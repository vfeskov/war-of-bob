self.levelView = function() {
  return level$ => {
    const levelEl = document.getElementById('level');
    level$.subscribe(level => {
      levelEl.firstChild && levelEl.removeChild(levelEl.firstChild);
      levelEl.appendChild(document.createTextNode(level + 1));
    });
  };
}();
