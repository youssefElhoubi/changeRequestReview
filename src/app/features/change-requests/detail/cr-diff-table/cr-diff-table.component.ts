import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { ChangeEntry } from '../../models/change-request.models';

@Component({
  selector: 'app-cr-diff-table',
  templateUrl: './cr-diff-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrDiffTableComponent {
  @Input() changes: ChangeEntry[] = [];

  totalBefore(): number {
    return this.total((change) => change.before);
  }

  totalAfter(): number {
    return this.total((change) => change.after);
  }

  overallDelta(): number {
    return Number((this.totalAfter() - this.totalBefore()).toFixed(2));
  }

  classification(
    change: ChangeEntry,
  ): 'Added' | 'Removed' | 'Changed' | 'Unchanged' {
    if (change.before === null && change.after !== null) {
      return 'Added';
    }
    if (change.before !== null && change.after === null) {
      return 'Removed';
    }
    return change.before === change.after ? 'Unchanged' : 'Changed';
  }

  delta(change: ChangeEntry): number | null {
    if (
      !this.isNumericOrNull(change.before) ||
      !this.isNumericOrNull(change.after) ||
      (change.before === null && change.after === null)
    ) {
      return null;
    }

    return Number(((change.after ?? 0) - (change.before ?? 0)).toFixed(2));
  }

  display(value: ChangeEntry['before']): string {
    return value === null ? '—' : String(value);
  }

  trackById(_index: number, change: ChangeEntry): string {
    return change.id;
  }

  private total(value: (change: ChangeEntry) => ChangeEntry['before']): number {
    return Number(
      this.changes
        .reduce((total, change) => {
          const currentValue = value(change);
          return total + (typeof currentValue === 'number' ? currentValue : 0);
        }, 0)
        .toFixed(2),
    );
  }

  private isNumericOrNull(
    value: ChangeEntry['before'],
  ): value is number | null {
    return value === null || typeof value === 'number';
  }
}
