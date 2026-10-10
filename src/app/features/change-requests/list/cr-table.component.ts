import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { ChangeRequestSummary } from '../models/change-request.models';

@Component({
  selector: 'app-cr-table',
  templateUrl: './cr-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrTableComponent {
  @Input() rows: ChangeRequestSummary[] = [];
  @Output() readonly rowClick = new EventEmitter<ChangeRequestSummary>();

  trackById(_index: number, row: ChangeRequestSummary): string {
    return row.id;
  }

  onRowClick(row: ChangeRequestSummary): void {
    this.rowClick.emit(row);
  }
}
