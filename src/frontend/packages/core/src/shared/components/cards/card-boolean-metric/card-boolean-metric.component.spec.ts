import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CardStatusComponent } from '../card-status/card-status.component';
import { CardBooleanMetricComponent } from './card-boolean-metric.component';

describe('CardBooleanMetricComponent', () => {
  let component: CardBooleanMetricComponent;
  let fixture: ComponentFixture<CardBooleanMetricComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CardBooleanMetricComponent, CardStatusComponent ],
      imports: [...BaseTestModulesNoShared],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardBooleanMetricComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
