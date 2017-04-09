+function({assign}, target) {
  assign(target, {levelView});

  function levelView(level$) {
    const levelEl = document.getElementById('level');
    level$.subscribe(level => {
      levelEl.firstChild && levelEl.removeChild(levelEl.firstChild);
      levelEl.appendChild(document.createTextNode(level + 1));
    });
  };
}(Object, self.Views = self.Views || {});
