const {Observable: $} = require('rxjs/Observable');

module.exports = {
  randomInterval(min, max) {
    return new $(sub => {
      let timeout = null;
      (function schedule() {
        timeout = setTimeout(
          () => {
            sub.next();
            schedule();
          },
          Math.floor(Math.random() * (max - min + 1) + min)
        );
      })();
      return () => clearTimeout(timeout);
    });
  },
  pad(n, width) {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
  }
};
