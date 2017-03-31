class BattlefieldDOMView {
  constructor(state$) {
    this.container = document.getElementById('battlefield');
    this.state = {};
    this.prevState = {};
    this.elements = {};
    state$.subscribe(state => this.state = state);
    this.render();
  }

  render() {
    requestAnimationFrame(() => {
      Object.keys(this.elements)
        .filter(id => !this.state[id])
        .forEach(id => {
          this.container.removeChild(this.elements[id]);
          delete this.elements[id];
        });
      Object.keys(this.state)
        .map(id => {
          if (!this.elements[id]) {
            this.elements[id] = this.createElement(this.state[id]);
          }
          return {id, element: this.elements[id], state: this.state[id], prevState: this.prevState[id] || {}};
        })
        .filter(({state, prevState}) =>
          prevState.x !== state.x ||
          prevState.y !== state.y
        )
        .forEach(({element, state, prevState}) => {
          if (prevState.x !== state.x) {
            element.style.left = `${state.x}%`;
          }
          if (prevState.y !== state.y) {
            element.style.top = `${state.y}%`;
          }
        });
      this.prevState = this.state;
      this.render();
    });
  }

  createElement({type, source, x, y, size}) {
    const el = document.createElement(type);
    el.style.width = el.style.height = `${size}%`;
    if (source !== undefined) {
      ['FROM_TOP', 'FROM_RIGHT', 'FROM_BOTTOM', 'FROM_LEFT']
        .filter(dir => source === eval(`PROJECTILE_${dir}`))
        .map(dir => dir.toLowerCase().replace('_', '-'))
        .forEach(dirClass => el.className += dirClass);
    }
    this.container.appendChild(el);
    return el;
  }
}
