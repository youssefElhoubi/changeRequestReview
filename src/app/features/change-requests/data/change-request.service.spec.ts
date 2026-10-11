import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { AuthenticationProvider } from '../../../core/auth/authentication-provider';
import { MockAuthenticationProvider } from '../../../core/auth/mock-authentication.provider';
import { MockBackendInterceptor } from '../../../core/api/mock-backend.interceptor';
import { MockDataStorageService } from '../../../core/api/mock-data-storage.service';
import { ChangeRequestStatus } from '../models/change-request.models';
import { ChangeRequestService } from './change-request.service';

describe('ChangeRequestService status updates', () => {
  let service: ChangeRequestService;
  let storage: MockDataStorageService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        ChangeRequestService,
        AuthService,
        MockDataStorageService,
        {
          provide: AuthenticationProvider,
          useClass: MockAuthenticationProvider,
        },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: MockBackendInterceptor,
          multi: true,
        },
      ],
    });
    service = TestBed.inject(ChangeRequestService);
    storage = TestBed.inject(MockDataStorageService);
    storage.initialize();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  function resolve<T>(request: Observable<T>): T {
    let result: T | undefined;
    request.subscribe((value) => (result = value));
    tick(501);
    if (result === undefined) {
      throw new Error('The mock API did not return a response.');
    }
    return result;
  }

  it('approves a pending request and persists the status after storage reload', fakeAsync(() => {
    storage.setCurrentUserId('u-alice');

    const updated = resolve(service.approve('cr-1001'));

    expect(updated.status).toBe(ChangeRequestStatus.Approved);
    expect(
      storage.getChangeRequests().find((request) => request.id === 'cr-1001')
        ?.status,
    ).toBe(ChangeRequestStatus.Approved);

    const reloadedStorage = new MockDataStorageService();
    expect(
      reloadedStorage
        .getChangeRequests()
        .find((request) => request.id === 'cr-1001')?.status,
    ).toBe(ChangeRequestStatus.Approved);
  }));

  it('rejects a pending request and stores the rejection event', fakeAsync(() => {
    storage.setCurrentUserId('u-alice');

    const updated = resolve(service.reject('cr-1001', 'Needs more evidence'));

    expect(updated.status).toBe(ChangeRequestStatus.Rejected);
    expect(updated.timeline[updated.timeline.length - 1].note).toBe(
      'Needs more evidence',
    );
  }));

  it('rejects an unauthorized status change and leaves the request unchanged', fakeAsync(() => {
    storage.setCurrentUserId('u-carol');

    let error: unknown;
    service.approve('cr-1001').subscribe({
      error: (value) => (error = value),
    });
    tick(501);

    expect(error).toMatchObject({ status: 403 });
    expect(
      storage.getChangeRequests().find((request) => request.id === 'cr-1001')
        ?.status,
    ).toBe(ChangeRequestStatus.PendingReview);
  }));

  it('creates a change request with PendingReview status and submitted timeline event', fakeAsync(() => {
    storage.setCurrentUserId('u-dave');

    const created = resolve(
      service.create({
        title: 'New Policy',
        description: 'New policy details',
        changes: [{ field: 'Retention', before: 30, after: 60 }],
      }),
    );

    expect(created.status).toBe(ChangeRequestStatus.PendingReview);
    expect(created.timeline.map((event) => event.type)).toEqual([
      'created',
      'submitted',
    ]);
  }));

  it('prevents self-approval when the approver created the request', fakeAsync(() => {
    // cr-1001 was created by u-bob
    storage.setCurrentUserId('u-bob');

    let error: unknown;
    service.approve('cr-1001').subscribe({
      error: (value) => (error = value),
    });
    tick(501);

    expect(error).toMatchObject({ status: 403 });
    expect(
      storage.getChangeRequests().find((request) => request.id === 'cr-1001')
        ?.status,
    ).toBe(ChangeRequestStatus.PendingReview);
  }));

  it('rejects changes to requests already in final states (409 Conflict)', fakeAsync(() => {
    storage.setCurrentUserId('u-alice');
    resolve(service.approve('cr-1001'));

    let secondApproveError: unknown;
    service.approve('cr-1001').subscribe({
      error: (value) => (secondApproveError = value),
    });
    tick(501);

    expect(secondApproveError).toMatchObject({ status: 409 });

    let rejectAfterApproveError: unknown;
    service.reject('cr-1001', 'Too late').subscribe({
      error: (value) => (rejectAfterApproveError = value),
    });
    tick(501);

    expect(rejectAfterApproveError).toMatchObject({ status: 409 });
  }));

  it('reflects updated status in request list and retains it across new storage instance', fakeAsync(() => {
    storage.setCurrentUserId('u-alice');
    resolve(service.approve('cr-1001'));

    const list = resolve(service.getChangeRequests());
    const itemInList = list.find((item) => item.id === 'cr-1001');
    expect(itemInList?.status).toBe(ChangeRequestStatus.Approved);

    // Simulating app refresh with fresh storage
    const reloadedStorage = new MockDataStorageService();
    const persisted = reloadedStorage
      .getChangeRequests()
      .find((item) => item.id === 'cr-1001');
    expect(persisted?.status).toBe(ChangeRequestStatus.Approved);
  }));
});
