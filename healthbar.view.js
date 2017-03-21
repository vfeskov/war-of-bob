class HealthbarView {
  constructor({bob}) {
    const element = document.createElement('health');
    document.getElementById('healthbar').appendChild(element);
    bob.health$.subscribe(hp => {
      element.style.width = `${hp}%`;
    });
  }
}
