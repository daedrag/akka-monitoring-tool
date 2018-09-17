import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonitorContainerComponent } from './monitor-container.component';

describe('MonitorContainerComponent', () => {
  let component: MonitorContainerComponent;
  let fixture: ComponentFixture<MonitorContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonitorContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonitorContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
