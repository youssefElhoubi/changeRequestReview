import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';

import { AuthService } from './core/auth/auth.service';
import { AuthenticationProvider } from './core/auth/authentication-provider';
import { MockAuthenticationProvider } from './core/auth/mock-authentication.provider';
import { MockBackendInterceptor } from './core/api/mock-backend.interceptor';
import { MockDataStorageService } from './core/api/mock-data-storage.service';
import { ChangeRequestService } from './features/change-requests/data/change-request.service';
import { ChangeRequestStatus } from './features/change-requests/models/change-request.models';
import { CrDetailComponent } from './features/change-requests/detail/cr-detail/cr-detail.component';
import { CrActionsComponent } from './features/change-requests/detail/cr-actions/cr-actions.component';
import { CrDiffTableComponent } from './features/change-requests/detail/cr-diff-table/cr-diff-table.component';
import { CrTimelineComponent } from './features/change-requests/detail/cr-timeline/cr-timeline.component';
import { CrListComponent } from './features/change-requests/list/cr-list.component';
import { CrTableComponent } from './features/change-requests/list/cr-table.component';

describe('Complete Approval Flow Integration Test', () => {
  let authService: AuthService;
  let crService: ChangeRequestService;
  let storage: MockDataStorageService;

  let routeParamSubject: BehaviorSubject<any>;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    routeParamSubject = new BehaviorSubject(convertToParamMap({ id: 'cr-1001' }));

    TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
      declarations: [
        CrDetailComponent,
        CrActionsComponent,
        CrDiffTableComponent,
        CrTimelineComponent,
        CrListComponent,
        CrTableComponent,
      ],
      providers: [
        AuthService,
        ChangeRequestService,
        MockDataStorageService,
        {
          provide: ActivatedRoute,
          useValue: { paramMap: routeParamSubject.asObservable() },
        },
        {
          provide: AuthenticationProvider,
          useClass: MockAuthenticationProvider,
        },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: MockBackendInterceptor,
          multi: true,
        },
        {
          provide: Router,
          useValue: { navigate: jest.fn(), navigateByUrl: jest.fn() },
        },
      ],
    });

    authService = TestBed.inject(AuthService);
    crService = TestBed.inject(ChangeRequestService);
    storage = TestBed.inject(MockDataStorageService);
    storage.initialize();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  it(
    'traces login -> approve pending request -> refresh -> reject pending request -> check unauthorized',
    async () => {
    // 1. Log in as Alice (authorized approver)
    const loggedInUser = await firstValueFrom(
      authService.login({ email: 'alice@example.com', password: 'Dev123!ChangeMe' }),
    );
    expect(loggedInUser).toBeDefined();
    expect(loggedInUser.role).toBe('approver');

    // 2. Open cr-1001 (created by Bob, PendingReview)
    routeParamSubject.next(convertToParamMap({ id: 'cr-1001' }));
    const fixtureDetail = TestBed.createComponent(CrDetailComponent);
    fixtureDetail.detectChanges();
    await wait(600); // wait for mock interceptor delay (500ms)
    fixtureDetail.detectChanges();

    const vmDetail = (fixtureDetail.componentInstance as any).vmSubject.value;
    console.log('Detail VM state:', vmDetail.state, 'changeRequest:', vmDetail.changeRequest?.id, 'canApprove:', vmDetail.canApprove);
    expect(vmDetail.changeRequest.id).toBe('cr-1001');
    expect(vmDetail.changeRequest.status).toBe(ChangeRequestStatus.PendingReview);
    expect(vmDetail.canApprove).toBe(true);
    expect(vmDetail.canReject).toBe(true);

    // 3. Click Approve
    const approveBtn = fixtureDetail.nativeElement.querySelector('[data-testid="approve-btn"]');
    expect(approveBtn.disabled).toBe(false);
    approveBtn.click();
    fixtureDetail.detectChanges();

    // Check action in flight
    expect(approveBtn.disabled).toBe(true);
    await wait(600); // wait for mock interceptor delay
    fixtureDetail.detectChanges();

    // Check updated status in detail view
    const updatedVm = (fixtureDetail.componentInstance as any).vmSubject.value;
    expect(updatedVm.changeRequest.status).toBe(ChangeRequestStatus.Approved);
    expect(fixtureDetail.nativeElement.textContent).toContain('Change request approved successfully.');
    expect(updatedVm.canApprove).toBe(false);
    expect(updatedVm.canReject).toBe(false);

    // 4. Refresh application: simulate fresh component & storage reload
    const reloadedStorage = new MockDataStorageService();
    const storedCr1001 = reloadedStorage.getChangeRequests().find((r) => r.id === 'cr-1001');
    expect(storedCr1001?.status).toBe(ChangeRequestStatus.Approved);

    const fixtureDetailReloaded = TestBed.createComponent(CrDetailComponent);
    fixtureDetailReloaded.detectChanges();
    await wait(600);
    fixtureDetailReloaded.detectChanges();

    const reloadedVm = (fixtureDetailReloaded.componentInstance as any).vmSubject.value;
    expect(reloadedVm.changeRequest.status).toBe(ChangeRequestStatus.Approved);
    expect(reloadedVm.canApprove).toBe(false);
    expect(reloadedVm.canReject).toBe(false);

    // 5. Repeat with another pending request: cr-1003 (created by Bob) -> Reject
    routeParamSubject.next(convertToParamMap({ id: 'cr-1003' }));
    const fixtureDetail1003 = TestBed.createComponent(CrDetailComponent);
    fixtureDetail1003.detectChanges();
    await wait(600);
    fixtureDetail1003.detectChanges();

    const vm1003 = (fixtureDetail1003.componentInstance as any).vmSubject.value;
    expect(vm1003.changeRequest.id).toBe('cr-1003');
    expect(vm1003.canReject).toBe(true);

    // Type rejection reason
    const textarea = fixtureDetail1003.nativeElement.querySelector('[data-testid="reject-reason"]');
    textarea.value = 'Unjustified limits change';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixtureDetail1003.detectChanges();

    const rejectBtn = fixtureDetail1003.nativeElement.querySelector('[data-testid="reject-btn"]');
    rejectBtn.click();
    fixtureDetail1003.detectChanges();
    await wait(600);
    fixtureDetail1003.detectChanges();

    const updatedVm1003 = (fixtureDetail1003.componentInstance as any).vmSubject.value;
    expect(updatedVm1003.changeRequest.status).toBe(ChangeRequestStatus.Rejected);
    expect(fixtureDetail1003.nativeElement.textContent).toContain('Change request rejected successfully.');

    // 6. Refresh and confirm it remains Rejected
    const storedCr1003 = reloadedStorage.getChangeRequests().find((r) => r.id === 'cr-1003');
    expect(storedCr1003?.status).toBe(ChangeRequestStatus.Rejected);

    // 7. Check List / Dashboard metrics consistency
    const fixtureList = TestBed.createComponent(CrListComponent);
    fixtureList.detectChanges();
    await wait(600);
    fixtureList.detectChanges();

    expect(fixtureList.componentInstance.countByStatus(ChangeRequestStatus.Approved)).toBeGreaterThanOrEqual(1);
    expect(fixtureList.componentInstance.countByStatus(ChangeRequestStatus.Rejected)).toBeGreaterThanOrEqual(1);

    // 8. Verify unauthorized users cannot approve or reject
    // 8a. Self-approval blocked: Bob cannot approve a request he created (cr-slow)
    await firstValueFrom(
      authService.login({ email: 'bob@example.com', password: 'Dev123!ChangeMe' }),
    );
    routeParamSubject.next(convertToParamMap({ id: 'cr-1001' }));
    const fixtureDetailBob = TestBed.createComponent(CrDetailComponent);
    fixtureDetailBob.detectChanges();
    await wait(600);
    fixtureDetailBob.detectChanges();

    const vmBob = (fixtureDetailBob.componentInstance as any).vmSubject.value;
    expect(vmBob.changeRequest.id).toBe('cr-1001');
    expect(vmBob.canApprove).toBe(false);
    expect(vmBob.canReject).toBe(false);

    // Backend also rejects self-approval
    let selfApprovalError: any;
    crService.approve('cr-1001').subscribe({
      error: (err) => (selfApprovalError = err),
    });
    await wait(600);
    expect(selfApprovalError?.status).toBe(403);

    // 8b. Viewer role blocked: Carol cannot approve or reject
    await firstValueFrom(
      authService.login({ email: 'carol@example.com', password: 'Dev123!ChangeMe' }),
    );
    routeParamSubject.next(convertToParamMap({ id: 'cr-1002' })); // PendingReview created by Alice
    const fixtureDetailCarol = TestBed.createComponent(CrDetailComponent);
    fixtureDetailCarol.detectChanges();
    await wait(600);
    fixtureDetailCarol.detectChanges();

    const vmCarol = (fixtureDetailCarol.componentInstance as any).vmSubject.value;
    expect(vmCarol.canApprove).toBe(false);
    expect(vmCarol.canReject).toBe(false);

    let carolApproveError: any;
    crService.approve('cr-1002').subscribe({
      error: (err) => (carolApproveError = err),
    });
    await wait(600);
    expect(carolApproveError?.status).toBe(403);

    // 8c. Unauthenticated requests are rejected
    authService.logout();
    let unauthError: any;
    crService.approve('cr-1002').subscribe({
      error: (err) => (unauthError = err),
    });
    await wait(600);
    expect(unauthError?.status).toBe(403);

    // 9. Verify error feedback on failed updates (cr-fail)
    await firstValueFrom(
      authService.login({ email: 'alice@example.com', password: 'Dev123!ChangeMe' }),
    );
    routeParamSubject.next(convertToParamMap({ id: 'cr-fail' }));
    const fixtureDetailFail = TestBed.createComponent(CrDetailComponent);
    fixtureDetailFail.detectChanges();
    await wait(600);
    fixtureDetailFail.detectChanges();

    const approveFailBtn = fixtureDetailFail.nativeElement.querySelector('[data-testid="approve-btn"]');
    approveFailBtn.click();
    fixtureDetailFail.detectChanges();
    await wait(600);
    fixtureDetailFail.detectChanges();

    const vmFail = (fixtureDetailFail.componentInstance as any).vmSubject.value;
    expect(vmFail.errorMessage).toBe('The change request service is unavailable.');
    expect(fixtureDetailFail.nativeElement.textContent).toContain('The change request service is unavailable.');
  }, 25000);
});
