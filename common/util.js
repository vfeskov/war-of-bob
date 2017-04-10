'use strict';
+function({assign}, {Observable: $}, target) {
  assign(target, {randomIntervalGenerator, pad});

  function randomIntervalGenerator(random = Math.random) {
    return (min, max) => {
      return new $(sub => {
        let timeout = null;
        (function schedule() {
          timeout = setTimeout(
            () => {
              sub.next();
              schedule();
            },
            Math.floor(random() * (max - min + 1) + min)
          );
        })();
        return () => clearTimeout(timeout);
      });
    }
  }

  function pad(n, width) {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
  }
}(Object, ...(typeof module !== 'undefined') ?
  [require('rxjs/Observable'), module.exports] :
  [Rx, self.Util = {}]
);
