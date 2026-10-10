import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { concat, Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';

import { AuthService } from '../../../../core/auth/auth.service';
import { ChangeRequestService } from '../../data/change-request.service';
import {
  ChangeRequest,
  UserPermission,
} from '../../models/change-request.models';

type DetailState = 'loading' | 'loaded' | 'error' | 'action-in-flight';

interface DetailViewModel {
  state: DetailState;
  changeRequest: ChangeRequest | null;
  errorMessage: string | null;
  canApprove: boolean;
  canReject: boolean;
}

@Component({
  selector: 'app-cr-detail',
  templateUrl: './cr-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrDetailComponent implements OnInit {
  vm$: Observable<DetailViewModel> = of(this.viewModel('loading'));
  private actionInFlight = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: ChangeRequestService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.vm$ = this.route.paramMap.pipe(
      switchMap((params) =>
        this.service.getChangeRequest(params.get('id') ?? '').pipe(
          map((changeRequest) => this.viewModel('loaded', changeRequest)),
          catchError(() =>
            of(
              this.viewModel(
                'error',
                null,
                'Unable to load this change request. Please try again.',
              ),
            ),
          ),
        ),
      ),
    );
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
    this.vm$ = concat(
      of(
        this.viewModel(
          'action-in-flight',
          current,
          null,
          this.canApprove(current),
          this.canReject(current),
        ),
      ),
      request.pipe(
        map((updated) => this.viewModel('loaded', updated)),
        catchError(() =>
          of(
            this.viewModel(
              'loaded',
              current,
              'The action failed. Your changes were not saved.',
            ),
          ),
        ),
        finalize(() => {
          this.actionInFlight = false;
        }),
      ),
    );
  }

  private canApprove(
    changeRequest: ChangeRequest,
    permission = UserPermission.ApproveChangeRequests,
  ): boolean {
    return (
      changeRequest.status === 'pending_review' &&
      changeRequest.createdBy.id !== this.authService.currentUserIdValue &&
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
    canApprove = changeRequest ? this.canApprove(changeRequest) : false,
    canReject = changeRequest
      ? this.canApprove(changeRequest, UserPermission.RejectChangeRequests)
      : false,
  ): DetailViewModel {
    return {
      state,
      changeRequest,
      errorMessage,
      canApprove,
      canReject,
    };
  }
}
