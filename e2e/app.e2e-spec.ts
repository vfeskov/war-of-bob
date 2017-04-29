import { WarOfBobPage } from './app.po';

describe('war-of-bob App', () => {
  let page: WarOfBobPage;

  beforeEach(() => {
    page = new WarOfBobPage();
  });

  it('should have WAR OF BOB title', () => {
    page.navigateTo();
    expect(page.title()).toEqual('WAR OF BOB');
  });
});
