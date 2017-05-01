import { TestBed, inject } from '@angular/core/testing';

import { BattlefieldService } from './battlefield.service';

describe('BattlefieldService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BattlefieldService]
    });
  });

  it('should ...', inject([BattlefieldService], (service: BattlefieldService) => {
    expect(service).toBeTruthy();
  }));
});
