import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of, throwError } from 'rxjs';

import { ChangeRequestService } from '../data/change-request.service';
import { AuthService } from '../../../core/auth/auth.service';
import {
  ChangeRequestStatus,
  ChangeRequestSummary,
  UserPermission,
} from '../models/change-request.models';
import { CrListComponent } from './cr-list.component';
import { CrTableComponent } from './cr-table.component';

describe('CrListComponent', () => {
  let fixture: ComponentFixture<CrListComponent>;
  let service: { getChangeRequests: jest.Mock };

  const rows: ChangeRequestSummary[] = [
    {
      id: 'cr-pending',
      title: 'Pending request',
      status: ChangeRequestStatus.PendingReview,
      createdBy: { id: 'u-bob', name: 'Bob' },
      createdAt: '2026-01-01T00:00:00.000Z',
      changeCount: 2,
    },
    {
      id: 'cr-approved',
      title: 'Approved request',
      status: ChangeRequestStatus.Approved,
      createdBy: { id: 'u-alice', name: 'Alice' },
      createdAt: '2026-01-02T00:00:00.000Z',
      changeCount: 1,
    },
  ];

  function createComponent(response: Observable<ChangeRequestSummary[]>): void {
    service = { getChangeRequests: jest.fn(() => response) };
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [CrListComponent, CrTableComponent],
      providers: [
        { provide: ChangeRequestService, useValue: service },
        {
          provide: AuthService,
          useValue: {
            state$: of({
              status: 'authenticated',
              user: {
                id: 'u-viewer',
                name: 'Viewer',
                passeord: 'Dev123!ChangeMe',
                role: 'viewer',
                permissions: [UserPermission.ViewChangeRequests],
              },
              error: null,
            }),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(CrListComponent);
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders the loading state while the request is pending', () => {
    createComponent(new Observable<ChangeRequestSummary[]>(() => undefined));

    expect(fixture.nativeElement.textContent).toContain(
      'Loading change requests...',
    );
    expect(
      fixture.nativeElement.querySelector('[aria-busy="true"]'),
    ).not.toBeNull();
    const spinner = fixture.nativeElement.querySelector(
      '[data-testid="loading-spinner"]',
    ) as SVGElement;
    expect(spinner).not.toBeNull();
    expect(spinner.classList.contains('animate-spin')).toBe(true);
    expect(spinner.getAttribute('role')).toBe('status');
  });

  it('renders the empty state when the API returns no rows', () => {
    createComponent(of([]));

    expect(fixture.nativeElement.textContent).toContain('No change requests');
    expect(
      fixture.nativeElement.querySelector('[data-testid="cr-row"]'),
    ).toBeNull();
  });

  it('renders the error state when loading fails', () => {
    createComponent(throwError(() => new Error('network failure')));

    expect(fixture.nativeElement.textContent).toContain(
      'Unable to load change requests. Please try again.',
    );
    expect(
      fixture.nativeElement.querySelector('[role="alert"]'),
    ).not.toBeNull();
  });

  it('updates the rendered rows when the status filter changes', () => {
    createComponent(of(rows));

    const select = fixture.nativeElement.querySelector(
      '[data-testid="status-filter"]',
    ) as HTMLSelectElement;
    select.value = ChangeRequestStatus.Approved;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const renderedRows = fixture.nativeElement.querySelectorAll(
      '[data-testid="cr-row"]',
    );
    expect(renderedRows).toHaveLength(1);
    expect(renderedRows[0].textContent).toContain('Approved request');
    expect(renderedRows[0].textContent).not.toContain('Pending request');
  });

  it('renders a no-match state when a filter excludes every loaded row', () => {
    createComponent(of(rows));

    const select = fixture.nativeElement.querySelector(
      '[data-testid="status-filter"]',
    ) as HTMLSelectElement;
    select.value = ChangeRequestStatus.Draft;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No matching change requests',
    );
    expect(
      fixture.nativeElement.querySelector('[data-testid="cr-row"]'),
    ).toBeNull();
  });
});
