import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith, tap } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { ChangeRequestService } from '../data/change-request.service';
import {
  ChangeRequestStatus,
  ChangeRequestSummary,
} from '../models/change-request.models';

type MyRequestsViewState = 'loading' | 'loaded' | 'empty' | 'error';

interface MyRequestsViewModel {
  state: MyRequestsViewState;
  rows: ChangeRequestSummary[];
  errorMessage: string | null;
}

@Component({
  selector: 'app-cr-my-requests',
  templateUrl: './cr-my-requests.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrMyRequestsComponent implements OnInit {
  readonly statuses = Object.values(ChangeRequestStatus);
  statusFilter = '';
  rows: ChangeRequestSummary[] = [];
  visibleRows: ChangeRequestSummary[] = [];
  vm$: Observable<MyRequestsViewModel> = of({
    state: 'loading',
    rows: [],
    errorMessage: null,
  });

  constructor(
    private readonly service: ChangeRequestService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const currentUserId = this.authService.currentUserIdValue;

    this.vm$ = this.service.getChangeRequests().pipe(
      map((rows: ChangeRequestSummary[]) =>
        rows.filter((row) => row.createdBy.id === currentUserId),
      ),
      tap((rows: ChangeRequestSummary[]) => {
        this.rows = [...rows];
        this.updateVisibleRows();
      }),
      map((rows: ChangeRequestSummary[]) => ({
        state: rows.length === 0 ? ('empty' as const) : ('loaded' as const),
        rows: [...rows],
        errorMessage: null,
      })),
      startWith({
        state: 'loading' as const,
        rows: [] as ChangeRequestSummary[],
        errorMessage: null,
      }),
      catchError(() =>
        of({
          state: 'error' as const,
          rows: [] as ChangeRequestSummary[],
          errorMessage: 'Unable to load your requests. Please try again.',
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
}
