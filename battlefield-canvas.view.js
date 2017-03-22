class BattlefieldCanvasView {
  constructor({battlefield}) {
    this.container = document.getElementById('battlefield');
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1000;
    this.canvas.height = 1000;
    this.updateCanvasSize();
    window.onresize = () => this.updateCanvasSize();

    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');

    this.state = {};
    battlefield.state$.subscribe(state => this.state = state);

    this.images = ['bob', 'bullet-from-top', 'bullet-from-right', 'bullet-from-bottom', 'bullet-from-left']
      .map(name => {
        const img = new Image();
        img.src = `${name}.png`;
        return {name, img};
      })
      .reduce((res, {name, img}) => Object.assign(res, {[name]: img}), {});

    this.raf();
  }

  updateCanvasSize() {
    const size = `${this.container.offsetWidth - 2}px`
    this.canvas.style.width = size;
    this.canvas.style.height = size;
  }

  raf() {
    requestAnimationFrame(() => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      Object.getOwnPropertySymbols(this.state)
        .map(key => this.state[key])
        .forEach(({type, source, size, x, y}) => {
          x = Math.round(x / 100 * this.canvas.width);
          y = Math.round(y / 100 * this.canvas.height);
          const width = Math.round(size / 100 * this.canvas.width);
          const height = Math.round(size / 100 * this.canvas.height);

          this.ctx.beginPath();
          this.ctx.lineWidth = 2;
          this.ctx.strokeStyle = '#ddd';
          this.ctx.rect(x, y, width, height);
          this.ctx.stroke();
          this.ctx.drawImage(this.getImage(type, source), x, y, width, height);
        });

      this.raf();
    });
  }

  getImage(type, source) {
    if (type !== 'bullet') { return this.images[type]; }
    const image = ['FROM_TOP', 'FROM_RIGHT', 'FROM_BOTTOM', 'FROM_LEFT']
      .filter(dir => source === Bullet[dir])
      .map(dir => 'bullet-' + dir.toLowerCase().replace('_', '-'))[0];
    return this.images[image];
  }
}
