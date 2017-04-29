import { browser, element, by } from 'protractor';

export class WarOfBobPage {
  navigateTo() {
    browser.waitForAngularEnabled(false);
    return browser.get('/');
  }

  title() {
    return browser.getTitle();
  }
}
