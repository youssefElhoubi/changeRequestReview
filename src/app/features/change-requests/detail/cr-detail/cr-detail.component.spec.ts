import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, Subject } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { ChangeRequestService } from '../../data/change-request.service';
import {
  ChangeRequest,
  ChangeRequestStatus,
} from '../../models/change-request.models';
import { CrActionsComponent } from '../cr-actions/cr-actions.component';
import { CrDiffTableComponent } from '../cr-diff-table/cr-diff-table.component';
import { CrTimelineComponent } from '../cr-timeline/cr-timeline.component';
import { CrDetailComponent } from './cr-detail.component';

describe('CrDetailComponent', () => {
  let fixture: ComponentFixture<CrDetailComponent>;
  let service: {
    getChangeRequest: jest.Mock;
    approve: jest.Mock;
    reject: jest.Mock;
  };
  let auth: { currentUserIdValue: string; hasPermission: jest.Mock };

  const changeRequest: ChangeRequest = {
    id: 'cr-1',
    title: 'Review request',
    status: ChangeRequestStatus.PendingReview,
    createdBy: { id: 'u-bob', name: 'Bob' },
    createdAt: '2026-01-01T00:00:00.000Z',
    changeCount: 4,
    description: 'Description',
    changes: [
      { id: 'added', field: 'New limit', before: null, after: 100 },
      { id: 'removed', field: 'Removed limit', before: 50, after: null },
      { id: 'changed', field: 'Changed limit', before: 10, after: 20 },
      { id: 'unchanged', field: 'Zero limit', before: 0, after: 0 },
    ],
    timeline: [
      {
        id: 'event-2',
        type: 'submitted',
        actor: { id: 'u-bob', name: 'Bob' },
        at: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'event-1',
        type: 'created',
        actor: { id: 'u-bob', name: 'Bob' },
        at: '2026-01-01T00:00:00.000Z',
      },
    ],
  };

  function createComponent(
    request = changeRequest,
    hasPermission = true,
  ): void {
    service = {
      getChangeRequest: jest.fn(() => of(request)),
      approve: jest.fn(() => of(request)),
      reject: jest.fn(() => of(request)),
    };
    auth = {
      currentUserIdValue: 'u-alice',
      hasPermission: jest.fn(() => hasPermission),
    };
    TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule],
      declarations: [
        CrDetailComponent,
        CrActionsComponent,
        CrDiffTableComponent,
        CrTimelineComponent,
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: request.id })) },
        },
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: ChangeRequestService, useValue: service },
        { provide: AuthService, useValue: auth },
      ],
    });
    fixture = TestBed.createComponent(CrDetailComponent);
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders the loaded request and its child content', () => {
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Review request');
    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="diff-row"]'),
    ).toHaveLength(4);
    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="timeline-event"]'),
    ).toHaveLength(2);
  });

  it('shows actions for an authorized approver and disables them for a viewer', () => {
    createComponent();
    expect(
      fixture.nativeElement.querySelector('[data-testid="approve-btn"]')
        .disabled,
    ).toBe(false);

    TestBed.resetTestingModule();
    createComponent(changeRequest, false);
    expect(
      fixture.nativeElement.querySelector('[data-testid="approve-btn"]')
        .disabled,
    ).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[data-testid="reject-btn"]')
        .disabled,
    ).toBe(true);
  });

  it('disables actions when the current user created the request', () => {
    createComponent({
      ...changeRequest,
      createdBy: { id: 'u-alice', name: 'Alice' },
    });

    expect(
      fixture.nativeElement.querySelector('[data-testid="approve-btn"]')
        .disabled,
    ).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[data-testid="reject-btn"]')
        .disabled,
    ).toBe(true);
  });

  it('disables actions for a non-pending request', () => {
    createComponent({ ...changeRequest, status: ChangeRequestStatus.Approved });

    expect(
      fixture.nativeElement.querySelector('[data-testid="approve-btn"]')
        .disabled,
    ).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[data-testid="reject-btn"]')
        .disabled,
    ).toBe(true);
  });

  it('shows the in-flight state and updates the request after approve succeeds', () => {
    const approveResponse = new Subject<ChangeRequest>();
    createComponent();
    service.approve.mockReturnValue(approveResponse.asObservable());

    fixture.nativeElement.querySelector('[data-testid="approve-btn"]').click();
    fixture.detectChanges();

    const approveButton = fixture.nativeElement.querySelector(
      '[data-testid="approve-btn"]',
    ) as HTMLButtonElement;
    expect(approveButton.disabled).toBe(true);
    expect(approveButton.textContent).toContain('Saving...');
    expect(fixture.nativeElement.textContent).toContain('Review request');

    approveResponse.next({
      ...changeRequest,
      status: ChangeRequestStatus.Approved,
    });
    approveResponse.complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('approved');
    expect(approveButton.disabled).toBe(true);
    expect(service.approve).toHaveBeenCalledWith(changeRequest.id);
  });

  it('prevents duplicate submissions while an action is in flight', () => {
    const rejectResponse = new Subject<ChangeRequest>();
    createComponent();
    service.reject.mockReturnValue(rejectResponse.asObservable());

    const textarea = fixture.nativeElement.querySelector(
      '[data-testid="reject-reason"]',
    ) as HTMLTextAreaElement;
    textarea.value = 'Needs another review';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const rejectButton = fixture.nativeElement.querySelector(
      '[data-testid="reject-btn"]',
    ) as HTMLButtonElement;
    const approveButton = fixture.nativeElement.querySelector(
      '[data-testid="approve-btn"]',
    ) as HTMLButtonElement;
    rejectButton.click();
    fixture.detectChanges();

    expect(rejectButton.disabled).toBe(true);
    expect(approveButton.disabled).toBe(true);

    rejectButton.click();
    approveButton.click();
    fixture.detectChanges();

    expect(service.reject).toHaveBeenCalledTimes(1);
    expect(service.approve).not.toHaveBeenCalled();
  });

  it('updates the DOM after a rejection succeeds', () => {
    const rejectedRequest: ChangeRequest = {
      ...changeRequest,
      status: ChangeRequestStatus.Rejected,
      timeline: [
        ...changeRequest.timeline,
        {
          id: 'event-rejected',
          type: 'rejected',
          actor: { id: 'u-alice', name: 'Alice' },
          at: '2026-01-03T00:00:00.000Z',
          note: 'Budget needs another review',
        },
      ],
    };
    const rejectResponse = new Subject<ChangeRequest>();
    createComponent();
    service.reject.mockReturnValue(rejectResponse.asObservable());

    const textarea = fixture.nativeElement.querySelector(
      '[data-testid="reject-reason"]',
    ) as HTMLTextAreaElement;
    textarea.value = 'Budget needs another review';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-testid="reject-btn"]').click();
    fixture.detectChanges();

    rejectResponse.next(rejectedRequest);
    rejectResponse.complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('rejected');
    expect(fixture.nativeElement.textContent).toContain(
      'Budget needs another review',
    );
    expect(
      fixture.nativeElement.querySelector('[data-testid="approve-btn"]')
        .disabled,
    ).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[data-testid="reject-btn"]')
        .disabled,
    ).toBe(true);
    expect(service.reject).toHaveBeenCalledWith(
      changeRequest.id,
      'Budget needs another review',
    );
  });

  it('renders an action failure and preserves a typed rejection reason', () => {
    const rejectResponse = new Subject<ChangeRequest>();
    createComponent();
    service.reject.mockReturnValue(rejectResponse.asObservable());

    const reason = 'Budget needs another review';
    const textarea = fixture.nativeElement.querySelector(
      '[data-testid="reject-reason"]',
    ) as HTMLTextAreaElement;
    textarea.value = reason;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-testid="reject-btn"]').click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="reject-btn"]')
        .disabled,
    ).toBe(true);

    rejectResponse.error(new Error('request failed'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'The action failed. Your changes were not saved.',
    );
    expect(
      fixture.nativeElement.querySelector('[data-testid="approve-btn"]')
        .disabled,
    ).toBe(false);
    expect(service.reject).toHaveBeenCalledWith(changeRequest.id, reason);
  });
});
