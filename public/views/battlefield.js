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

//need to have canvas this big to not mangle images.
//use transform:scale to fit it in the viewport
const CANVAS_SIZE = 1000;//px

const pxls = prcnt => Math.round(prcnt * CANVAS_SIZE / 100);

class BattlefieldView {
  constructor(state$, bobHp$, level$) {
    this.prevState = {};
    this.state = {};
    state$.subscribe(state => this.state = state, 0, () => this.finished = true);

    bobHp$.subscribe(bobHp => this.bobHp = bobHp);

    this.levelContainer = document.getElementById('level');
    level$.subscribe(level => this.updateLevel(level + 1));

    this.container = document.getElementById('battlefield');
    this.canvas = document.getElementById('battlefield-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = CANVAS_SIZE;
    this.canvas.height = CANVAS_SIZE;
    this.updateCanvasSize();
    window.onresize = () => this.updateCanvasSize();

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
    this.canvas.style.transformOrigin = '0 0';
    this.canvas.style.transform = `scale(${scale})`;
  }

  prepareImages() {
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
      //clear previous state on the canvas
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
          //draw cached scaled image from the offscreen canvas
          this.ctx.putImageData(this.getImageData(type, source, size), pxls(x), pxls(y));
          type === BOB && this.renderHealthbar(this.ctx, x, y, size, this.bobHp);
        });

      this.prevState = this.state;
      !this.finished && this.render();
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

  //need to draw scaled images beforehand on an offscreen canvas and cache the data
  //to improve performance
  makeImageData(image, size) {
    const w = Math.round(size / 100 * CANVAS_SIZE);
    const h = Math.round(size / 100 * CANVAS_SIZE);
    this.offscreenContext.clearRect(0, 0, w, h);
    this.offscreenContext.drawImage(image, 0, 0, w, h);
    return this.offscreenContext.getImageData(0, 0, w, h);
  }

  updateLevel(level) {
    this.levelContainer.removeChild(this.levelContainer.firstChild);
    this.levelContainer.appendChild(document.createTextNode(level));
  }

  renderHealthbar(ctx, x, y, size, hp) {
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
}
