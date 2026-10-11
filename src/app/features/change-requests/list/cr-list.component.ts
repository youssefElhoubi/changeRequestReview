import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith, tap } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import {
  ChangeRequestStatus,
  ChangeRequestSummary,
  UserPermission,
} from '../models/change-request.models';
import { ChangeRequestService } from '../data/change-request.service';

type CrListViewState = 'loading' | 'loaded' | 'empty' | 'error';

interface CrListViewModel {
  state: CrListViewState;
  rows: ChangeRequestSummary[];
  errorMessage: string | null;
}

@Component({
  selector: 'app-cr-list',
  templateUrl: './cr-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrListComponent implements OnInit {
  readonly statuses = Object.values(ChangeRequestStatus);
  readonly pendingReviewStatus = ChangeRequestStatus.PendingReview;
  readonly approvedStatus = ChangeRequestStatus.Approved;
  readonly rejectedStatus = ChangeRequestStatus.Rejected;
  readonly authState$ = this.authService.state$;
  readonly viewPermission = UserPermission.ViewChangeRequests;
  readonly createPermission = UserPermission.CreateChangeRequests;
  statusFilter = '';
  rows: ChangeRequestSummary[] = [];
  visibleRows: ChangeRequestSummary[] = [];
  vm$: Observable<CrListViewModel> = of({
    state: 'loading',
    rows: [],
    errorMessage: null,
  });

  constructor(
    private readonly changeRequestService: ChangeRequestService,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.vm$ = this.changeRequestService.getChangeRequests().pipe(
      tap((rows) => {
        this.rows = [...rows];
        this.updateVisibleRows();
      }),
      map((rows) => ({
        state: rows.length === 0 ? ('empty' as const) : ('loaded' as const),
        rows: [...rows],
        errorMessage: null,
      })),
      startWith({
        state: 'loading' as const,
        rows: [],
        errorMessage: null,
      }),
      catchError(() =>
        of({
          state: 'error' as const,
          rows: [],
          errorMessage: 'Unable to load change requests. Please try again.',
        }),
      ),
    );
  }

  private updateVisibleRows(): void {
    this.visibleRows = this.statusFilter
      ? this.rows.filter((row) => row.status === this.statusFilter)
      : [...this.rows];
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter = value;
    this.updateVisibleRows();
  }

  onStatusFilterEvent(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.onStatusFilterChange(select.value);
  }

  onRowClick(row: ChangeRequestSummary): void {
    void this.router.navigate(['/change-requests', row.id]);
  }

  formatStatus(status: ChangeRequestStatus): string {
    return status.replace('_', ' ');
  }

  get recentRows(): ChangeRequestSummary[] {
    return [...this.visibleRows].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    );
  }

  countByStatus(status: ChangeRequestStatus): number {
    return this.rows.filter((row) => row.status === status).length;
  }

  hasCreatePermission(permissions: UserPermission[]): boolean {
    return permissions.includes(this.createPermission);
  }

  canCreateUsers(role: string): boolean {
    return role === 'approver';
  }
}
