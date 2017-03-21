class BattlefieldView {
  constructor({battlefield}) {
    this.container = document.getElementById('battlefield');
    this.addBob(battlefield.bob);
    battlefield.bullet$.subscribe(bullet => this.addBullet(bullet));
  }

  createUnitElement(unit, tag) {
    const el = document.createElement(tag);
    el.style.width = el.style.height = `${unit.size}%`;
    if (unit instanceof Bullet) { this.addBulletClass(unit, el); }
    unit.x$.subscribe(x => el.style.left = `${x}%`);
    unit.y$.subscribe(y => el.style.top = `${y}%`);
    unit.dead$.subscribe(() => this.container.removeChild(el));
    this.container.appendChild(el);
    return el;
  }

  addBob(bob) {
    this.createUnitElement(bob, 'bob');
  }

  addBullet(bullet) {
    this.createUnitElement(bullet, 'bullet');
  }

  addBulletClass(bullet, element) {
    ['FROM_TOP', 'FROM_RIGHT', 'FROM_BOTTOM', 'FROM_LEFT']
      .filter(dir => bullet.source === Bullet[dir])
      .map(dir => dir.toLowerCase().replace('_', '-'))
      .forEach(dirClass => element.className += dirClass);
  }
}
