import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import {
  ChangeRequest,
  ChangeRequestStatus,
} from '../../models/change-request.models';
import { CrActionsComponent } from './cr-actions.component';

describe('CrActionsComponent', () => {
  let fixture: ComponentFixture<CrActionsComponent>;
  const changeRequest: ChangeRequest = {
    id: 'cr-1',
    title: 'Review request',
    status: ChangeRequestStatus.PendingReview,
    createdBy: { id: 'u-bob', name: 'Bob' },
    createdAt: '2026-01-01T00:00:00.000Z',
    changeCount: 1,
    description: 'Description',
    changes: [{ id: 'budget', field: 'Budget', before: 1, after: 2 }],
    timeline: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule],
      declarations: [CrActionsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CrActionsComponent);
    fixture.componentInstance.changeRequest = changeRequest;
  });

  it('disables both actions and the reason field for an unauthorized user', () => {
    fixture.componentInstance.canApprove = false;
    fixture.componentInstance.canReject = false;
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="approve-btn"]')
        .disabled,
    ).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[data-testid="reject-btn"]')
        .disabled,
    ).toBe(true);
  });

  it('shows validation and emits nothing for an empty or whitespace reason', () => {
    fixture.componentInstance.canReject = true;
    const reject = jest.spyOn(fixture.componentInstance.reject, 'emit');
    fixture.detectChanges();

    const reason = fixture.nativeElement.querySelector(
      '[data-testid="reject-reason"]',
    ) as HTMLTextAreaElement;
    reason.value = '   ';
    reason.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.nativeElement
      .querySelector('[data-testid="reject-btn"]')
      .dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'A rejection reason is required.',
    );
    expect(reject).not.toHaveBeenCalled();
  });

  it('emits a trimmed rejection request for a valid reason', () => {
    fixture.componentInstance.canReject = true;
    const reject = jest.spyOn(fixture.componentInstance.reject, 'emit');
    fixture.detectChanges();

    const reason = fixture.nativeElement.querySelector(
      '[data-testid="reject-reason"]',
    ) as HTMLTextAreaElement;
    reason.value = '  Not enough evidence  ';
    reason.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.nativeElement
      .querySelector('[data-testid="reject-btn"]')
      .dispatchEvent(new Event('click'));

    expect(reject).toHaveBeenCalledWith({
      changeRequest,
      reason: '  Not enough evidence  ',
    });
  });
});
