import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';

import { ChangeRequestService } from '../data/change-request.service';
import { CrCreateComponent } from './cr-create.component';

describe('CrCreateComponent', () => {
  let fixture: ComponentFixture<CrCreateComponent>;
  let service: { create: jest.Mock };
  let router: Router;

  beforeEach(async () => {
    service = { create: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [CrCreateComponent],
      providers: [{ provide: ChangeRequestService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(CrCreateComponent);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('shows inline validation and preserves values for an invalid submission', () => {
    fixture.componentInstance.form.patchValue({
      title: 'Budget change',
      description: '',
    });

    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(service.create).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.get('title')?.value).toBe(
      'Budget change',
    );
    expect(fixture.componentInstance.form.get('description')?.touched).toBe(
      true,
    );
  });

  it('submits valid values and navigates to the created request', () => {
    service.create.mockReturnValue(
      of({
        id: 'cr-created',
      }),
    );
    fixture.componentInstance.form.patchValue({
      title: 'Budget change',
      description: 'Adjust the quarterly budget.',
    });
    fixture.componentInstance.changes.at(0).patchValue({
      field: 'Marketing budget',
      before: '100',
      after: '125',
    });

    fixture.componentInstance.submit();

    expect(service.create).toHaveBeenCalledWith({
      title: 'Budget change',
      description: 'Adjust the quarterly budget.',
      changes: [
        {
          field: 'Marketing budget',
          before: '100',
          after: '125',
        },
      ],
    });
    expect(router.navigate).toHaveBeenCalledWith([
      '/change-requests',
      'cr-created',
    ]);
  });

  it('prevents duplicate submissions while the create request is in flight', () => {
    const response = new Subject<{ id: string }>();
    service.create.mockReturnValue(response.asObservable());
    fixture.componentInstance.form.patchValue({
      title: 'Budget change',
      description: 'Adjust the quarterly budget.',
    });
    fixture.componentInstance.changes.at(0).patchValue({
      field: 'Marketing budget',
    });

    fixture.componentInstance.submit();
    fixture.componentInstance.submit();

    expect(service.create).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.form.disabled).toBe(true);
  });

  it('cancels by returning to the change request list', () => {
    fixture.componentInstance.cancel();

    expect(router.navigate).toHaveBeenCalledWith(['/change-requests']);
  });
});
