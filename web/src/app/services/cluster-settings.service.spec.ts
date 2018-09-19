import { TestBed } from '@angular/core/testing';

import { ClusterSettingsService } from './cluster-settings.service';

describe('ClusterSettingsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ClusterSettingsService = TestBed.get(ClusterSettingsService);
    expect(service).toBeTruthy();
  });
});
