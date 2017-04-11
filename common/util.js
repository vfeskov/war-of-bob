'use strict';
+function({assign}, {floor, random}, {Observable: $}, target) {
  assign(target, {randomInterval, pad});

  function randomInterval(min, max) {
    return new $(sub => {
      let timeout = null;
      (function schedule() {
        timeout = setTimeout(
          () => {
            sub.next();
            schedule();
          },
          floor(random() * (max - min + 1) + min)
        );
      })();
      return () => clearTimeout(timeout);
    });
  }

  function pad(n, width) {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
  }
}(Object, Math, ...(typeof module !== 'undefined') ?
  [require('rxjs/Observable'), module.exports] :
  [Rx, self.Util = {}]
);
