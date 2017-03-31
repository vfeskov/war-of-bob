class BattlefieldView {
  constructor(state$) {
    this.container = document.getElementById('battlefield');
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1000;
    this.canvas.height = 1000;
    this.updateCanvasSize();
    window.onresize = () => this.updateCanvasSize();

    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');

    this.state = {};
    state$.subscribe(state => this.state = state, null, () => this.finished = true);

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
    this.offscreenContext = this.offscreenCanvas.getContext('2d');

    this.images = [
      'bullet-from-top',
      'bullet-from-right',
      'bullet-from-bottom',
      'bullet-from-left',
      'syringe-from-top',
      'syringe-from-right',
      'syringe-from-bottom',
      'syringe-from-left',
      'bob'
    ]
      .map(name => {
        const img = new Image();
        img.src = `images/${name}.png`;
        return {name, img};
      })
      .reduce((res, {name, img}) => Object.assign({}, res, {[name]: img}), {});

    this.imageData = {};

    this.raf();
  }

  updateCanvasSize() {
    const scale = (this.container.offsetWidth - 2) / this.canvas.width;
    this.canvas.style.transformOrigin = '0 0'; //scale from top left
    this.canvas.style.transform = `scale(${scale})`;
  }

  raf() {
    requestAnimationFrame(() => {
      if (this.prevState) {
        Object.keys(this.prevState)
          .map(key => this.prevState[key])
          .forEach(({size, x, y}) => {
            this.ctx.clearRect(x * 10, y * 10, size * 10, size * 10);
          });
      }

      Object.keys(this.state)
        .map(key => this.state[key])
        .forEach(({type, source, size, x, y}) => {
          this.ctx.putImageData(this.getImageData(type, source, size), x * 10, y * 10);
        });

      this.prevState = this.state;
      !this.finished && this.raf();
    });
  }

  getImage(type, source) {
    return this.images[this.getImageName(type, source)];
  }

  getImageName(type, source) {
    if (type === 'bob') { return type; }
    return ['FROM_TOP', 'FROM_RIGHT', 'FROM_BOTTOM', 'FROM_LEFT']
      .filter(dir => source === eval(`PROJECTILE_${dir}`))
      .map(dir => type + '-' + dir.toLowerCase().replace('_', '-'))[0];
  }

  getImageData(type, source = '', size) {
    const id = type + source + size
    if (!this.imageData[id]) {
      const img = this.getImage(type, source);
      const w = Math.round(size / 100 * this.canvas.width);
      const h = Math.round(size / 100 * this.canvas.height);
      this.offscreenContext.clearRect(0, 0, w, h);
      this.offscreenContext.drawImage(img, 0, 0, w, h);
      this.imageData[id] = this.offscreenContext.getImageData(0, 0, w, h);
    }
    return this.imageData[id];
  }
}
