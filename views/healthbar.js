class HealthbarView {
  constructor(bobHp$) {
    const element = document.createElement('health');
    document.getElementById('healthbar').appendChild(element);
    bobHp$.subscribe(hp => {
      element.style.width = `${hp}%`;
    });
  }
}
