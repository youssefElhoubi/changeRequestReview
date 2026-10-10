import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith, tap } from 'rxjs/operators';

import {
  ChangeRequestStatus,
  ChangeRequestSummary,
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
}
