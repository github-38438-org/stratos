import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { AutoscalerMetricPageComponent } from './autoscaler-metric-page.component';
import { ApplicationService } from '../../../features/applications/application.service';
import { ApplicationServiceMock } from '../../../../test-framework/application-service-helper';
import { TabNavService } from '../../../../tab-nav.service';

describe('AutoscalerMetricPageComponent', () => {
  let component: AutoscalerMetricPageComponent;
  let fixture: ComponentFixture<AutoscalerMetricPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AutoscalerMetricPageComponent],
      imports: [
        BrowserAnimationsModule,
        createBasicStoreModule(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
      ],
      providers: [
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoscalerMetricPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
