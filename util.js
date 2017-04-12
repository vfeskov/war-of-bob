'use strict';
const {Observable: $} = require('rxjs/Observable'),
  {assign} = Object,
  {floor, random} = Math;

module.exports = {randomInterval, pad};

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
