const TYPE = {
  [BOB]: 'bob',
  [BULLET]: 'bullet',
  [SYRINGE]: 'syringe'
};

const SOURCE = {
  [FROM_TOP]: 'from-top',
  [FROM_RIGHT]: 'from-right',
  [FROM_BOTTOM]: 'from-bottom',
  [FROM_LEFT]: 'from-left'
};

const CANVAS_SIZE = 1000;//px

class BattlefieldView {
  constructor(state$) {
    this.container = document.getElementById('battlefield');
    this.canvas = document.createElement('canvas');
    this.canvas.width = CANVAS_SIZE;
    this.canvas.height = CANVAS_SIZE;
    this.updateCanvasSize();
    window.onresize = () => this.updateCanvasSize();

    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');

    this.prevState = {};
    this.state = {};
    state$.subscribe(state => this.state = state);

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = CANVAS_SIZE;
    this.offscreenCanvas.height = CANVAS_SIZE;
    this.offscreenContext = this.offscreenCanvas.getContext('2d');

    this.images = {};
    this.imageData = {};
    this.prepareImages()
      .then(() => this.render());
  }

  updateCanvasSize() {
    const scale = (this.container.offsetWidth - 2) / CANVAS_SIZE;
    this.canvas.style.transformOrigin = '0 0'; //scale from top left
    this.canvas.style.transform = `scale(${scale})`;
  }

  prepareImages() {
    return Promise.all(
      [
        'bullet-from-top',
        'bullet-from-right',
        'bullet-from-bottom',
        'bullet-from-left',
        'syringe-from-top',
        'syringe-from-right',
        'syringe-from-bottom',
        'syringe-from-left',
        'bob'
      ].map(name => new Promise(resolve => {
        const image = new Image();
        image.onload = () => resolve({name, image});
        image.src = `images/${name}.png`;
      }))
    ).then(images => {
      this.images = images.reduce(
        (res, {name, image}) => Object.assign({}, res, {[name]: image}), {}
      );
      this.imageData = images
        .map(({name, image}) =>
          (name === 'bob' ? [6] : [2, 4, 6])
            .map(size => ({size, imageData: this.makeImageData(image, size)}))
            .reduce(
              (result, {size, imageData}) =>
                Object.assign({}, result, {[`${name}-${size}`]: imageData}),
              {}
            )
        )
        .reduce((result, imageDatas) => Object.assign({}, result, imageDatas));
    });
  }

  render() {
    requestAnimationFrame(() => {
      Object.keys(this.prevState)
        .map(key => this.prevState[key])
        .forEach(({size, x, y}) => {
          x = Math.round(x / 100 * CANVAS_SIZE);
          y = Math.round(y / 100 * CANVAS_SIZE);
          size = Math.round(size / 100 * CANVAS_SIZE);
          this.ctx.clearRect(x, y, size, size);
        });

      Object.keys(this.state)
        .map(key => this.state[key])
        .forEach(({type, source, size, x, y}) => {
          x = Math.round(x / 100 * CANVAS_SIZE);
          y = Math.round(y / 100 * CANVAS_SIZE);
          this.ctx.putImageData(this.getImageData(type, source, size), x, y);
        });

      this.prevState = this.state;
      this.render();
    });
  }

  getImageName(type, source) {
    return type === BOB ? TYPE[BOB] : `${TYPE[type]}-${SOURCE[source]}`;
  }

  getImageData(type, source, size) {
    const imageName = this.getImageName(type, source);
    const imageDataId = `${imageName}-${size}`;
    if (!this.imageData[imageDataId]) {
      const image = this.images[imageName];
      this.imageData[imageDataId] = this.makeImageData(image, size);
    }
    return this.imageData[imageDataId];
  }

  makeImageData(image, size) {
    const w = Math.round(size / 100 * CANVAS_SIZE);
    const h = Math.round(size / 100 * CANVAS_SIZE);
    this.offscreenContext.clearRect(0, 0, w, h);
    this.offscreenContext.drawImage(image, 0, 0, w, h);
    return this.offscreenContext.getImageData(0, 0, w, h);
  }
}
