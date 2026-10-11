import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  catchError,
  finalize,
  map,
  switchMap,
  takeUntil,
} from 'rxjs/operators';

import { AuthService } from '../../../../core/auth/auth.service';
import { ChangeRequestService } from '../../data/change-request.service';
import {
  ChangeRequest,
  ChangeRequestStatus,
  UserPermission,
} from '../../models/change-request.models';

type DetailState = 'loading' | 'loaded' | 'error' | 'action-in-flight';

interface DetailViewModel {
  state: DetailState;
  changeRequest: ChangeRequest | null;
  errorMessage: string | null;
  successMessage: string | null;
  canApprove: boolean;
  canReject: boolean;
}

@Component({
  selector: 'app-cr-detail',
  templateUrl: './cr-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrDetailComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly vmSubject = new BehaviorSubject<DetailViewModel>(
    this.viewModel('loading'),
  );
  readonly vm$: Observable<DetailViewModel> = this.vmSubject.asObservable();
  private actionInFlight = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: ChangeRequestService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) =>
          this.service.getChangeRequest(params.get('id') ?? '').pipe(
            map((changeRequest) => this.viewModel('loaded', changeRequest)),
            catchError(() => {
              return [
                this.viewModel(
                  'error',
                  null,
                  'Unable to load this change request. Please try again.',
                ),
              ];
            }),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((viewModel) => this.vmSubject.next(viewModel));
  }

  onApprove(changeRequest: ChangeRequest): void {
    if (!this.canAct(changeRequest, UserPermission.ApproveChangeRequests)) {
      return;
    }
    this.submit(changeRequest, this.service.approve(changeRequest.id));
  }

  onReject(event: { changeRequest: ChangeRequest; reason: string }): void {
    if (
      !this.canAct(event.changeRequest, UserPermission.RejectChangeRequests) ||
      !event.reason.trim()
    ) {
      return;
    }
    this.submit(
      event.changeRequest,
      this.service.reject(event.changeRequest.id, event.reason.trim()),
    );
  }

  onBack(): void {
    void this.router.navigate(['/change-requests']);
  }

  private submit(
    current: ChangeRequest,
    request: Observable<ChangeRequest>,
  ): void {
    if (this.actionInFlight) {
      return;
    }
    this.actionInFlight = true;
    this.vmSubject.next(
      this.viewModel(
        'action-in-flight',
        current,
        null,
        null,
        this.canApprove(current),
        this.canReject(current),
      ),
    );
    request
      .pipe(
        map((updated) =>
          this.viewModel(
            'loaded',
            updated,
            null,
            updated.status === ChangeRequestStatus.Approved
              ? 'Change request approved successfully.'
              : 'Change request rejected successfully.',
          ),
        ),
        catchError(() => [
          this.viewModel(
            'loaded',
            current,
            'The action failed. Your changes were not saved.',
          ),
        ]),
        finalize(() => {
          this.actionInFlight = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((viewModel) => this.vmSubject.next(viewModel));
  }

  private canApprove(
    changeRequest: ChangeRequest,
    permission = UserPermission.ApproveChangeRequests,
  ): boolean {
    return (
      changeRequest.status === ChangeRequestStatus.PendingReview &&
      changeRequest.createdBy.id !== this.authService.currentUserIdValue &&
      this.authService.hasRole('approver') &&
      this.authService.hasPermission(permission)
    );
  }

  private canAct(
    changeRequest: ChangeRequest,
    permission: UserPermission,
  ): boolean {
    return this.canApprove(changeRequest, permission);
  }

  private canReject(changeRequest: ChangeRequest): boolean {
    return this.canApprove(changeRequest, UserPermission.RejectChangeRequests);
  }

  private viewModel(
    state: DetailState,
    changeRequest: ChangeRequest | null = null,
    errorMessage: string | null = null,
    successMessage: string | null = null,
    canApprove = changeRequest ? this.canApprove(changeRequest) : false,
    canReject = changeRequest
      ? this.canApprove(changeRequest, UserPermission.RejectChangeRequests)
      : false,
  ): DetailViewModel {
    return {
      state,
      changeRequest,
      errorMessage,
      successMessage,
      canApprove,
      canReject,
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
