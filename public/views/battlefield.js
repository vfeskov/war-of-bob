'use strict';
+function(
  {keys, assign},
  {Observable: $},
  {moveProjectile, BOB, BULLET, FOOD, FROM_TOP, FROM_RIGHT, FROM_BOTTOM, FROM_LEFT},
  target
) {
  assign(target, {battlefieldView});

  const TYPE = {
    [BOB]: 'bob',
    [BULLET]: 'bullet',
    [FOOD]: 'food'
  };

  const SOURCE = {
    [FROM_TOP]: 'from-top',
    [FROM_RIGHT]: 'from-right',
    [FROM_BOTTOM]: 'from-bottom',
    [FROM_LEFT]: 'from-left'
  };

  const CANVAS_SIZE = 1000;//px

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = CANVAS_SIZE;
  offscreenCanvas.height = CANVAS_SIZE;
  const offscreenCtx = offscreenCanvas.getContext('2d');

  const preparedImages = prepareImages();

  function battlefieldView(bob$, projectile$, bobHp$) {
    const container = document.getElementById('battlefield');
    const canvas = document.getElementById('battlefield-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    updateCanvasSize(container, canvas);
    window.onresize = () => updateCanvasSize(container, canvas);

    var prevState = {}, state = {}, finished = false;
    const _projectile$ = projectile$
      .filter(p => !p.dead)
      .mergeMap(projectile => {
        const {id, speed} = projectile;
        const dead$ = projectile$.filter(p => p.id === id && p.dead);
        return $.interval(speed)
          .startWith(projectile)
          .scan(moveProjectile)
          .takeUntil(dead$)
          .merge(dead$);
      });
    const _bob$ = bob$.map(bob => assign(bob, {type: BOB}));
    $.merge(_bob$, _projectile$)
      .scan((_state, {id, type, source, size, x, y, dead}) => {
        const newState = assign({}, _state);
        if (dead) {
          delete newState[id];
        } else {
          newState[id] = {id, type, source, size, x, y};
        }
        return newState;
      }, {})
      .subscribe(_state => state = _state, 0, () => finished = true);

    var bobHp;
    bobHp$.subscribe(_bobHp => bobHp = _bobHp);

    var images = {}, imageData = {};
    preparedImages
      .then(({images: i, imageData: d}) => {
        images = i;
        imageData = d;
        render();
      });

    function render() {
      requestAnimationFrame(() => {
        keys(prevState)
          .map(key => prevState[key])
          .forEach(({size, x, y}) =>
            ctx.clearRect(pxls(x), pxls(y), pxls(size), pxls(size))
          );

        keys(state)
          .map(key => state[key])
          .forEach(({type, source, size, x, y}) => {
            const data = getImageData(images, imageData, type, source, size);
            data && ctx.putImageData(data, pxls(x), pxls(y));
            type === BOB && renderHealthbar(ctx, x, y, size, bobHp);
          });

        prevState = state;
        !finished && render();
      });
    }
  };

  function pxls(prcnt) {
    return Math.round(prcnt * CANVAS_SIZE / 100);
  }

  function updateCanvasSize(container, canvas) {
    const scale = (container.offsetWidth - 2) / CANVAS_SIZE;
    canvas.style.transformOrigin = '0 0';
    canvas.style.transform = `scale(${scale})`;
  }

  function prepareImages() {
    return Promise.all(
      [
        'bullet-from-top',
        'bullet-from-right',
        'bullet-from-bottom',
        'bullet-from-left',
        'food-from-top',
        'food-from-right',
        'food-from-bottom',
        'food-from-left',
        'bob'
      ].map(name => new Promise(resolve => {
        const image = new Image();
        image.onload = () => resolve({name, image});
        image.src = `images/${name}.png`;
      }))
    ).then(images =>
      ({
        images: images.reduce(
          (res, {name, image}) => assign({}, res, {[name]: image}), {}
        ),
        imageData: images
          .map(({name, image}) =>
            (name === 'bob' ? [6] : [2, 4, 6])
              .map(size => ({size, imageData: makeImageData(image, size)}))
              .reduce(
                (result, {size, imageData}) =>
                  assign({}, result, {[`${name}-${size}`]: imageData}),
                {}
              )
          )
          .reduce((result, imageDatas) => assign({}, result, imageDatas))
      })
    );
  }

  function getImageName(type, source) {
    return type === BOB ? TYPE[BOB] : `${TYPE[type]}-${SOURCE[source]}`;
  }

  function getImageData(images, imageData, type, source, size) {
    const imageName = getImageName(type, source);
    const imageDataId = `${imageName}-${size}`;
    if (!imageData[imageDataId]) {
      const image = images[imageName];
      imageData[imageDataId] = makeImageData(image, size);
    }
    return imageData[imageDataId];
  }

  function makeImageData(image, size) {
    const w = Math.round(size / 100 * CANVAS_SIZE);
    const h = Math.round(size / 100 * CANVAS_SIZE);
    offscreenCtx.clearRect(0, 0, w, h);
    offscreenCtx.drawImage(image, 0, 0, w, h);
    return offscreenCtx.getImageData(0, 0, w, h);
  }

  function renderHealthbar(ctx, x, y, size, hp) {
    const line = (xPxls1, xPxls2, color) => {
      ctx.beginPath();
      ctx.moveTo(xPxls1, pxls(y + size - 0.5));
      ctx.lineTo(xPxls2, pxls(y + size - 0.5));
      ctx.lineWidth = pxls(1);
      ctx.strokeStyle = color;
      ctx.stroke();
    };
    hp > 0 && line(pxls(x), pxls(x + size * hp / 6), '#55ba6a');
    line(pxls(x + size * hp / 6), pxls(x + size), '#fc6e51');
  }
}(Object, Rx, self.Game, self.Views = self.Views || {});
