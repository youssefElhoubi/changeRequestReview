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
    const beforeNum = this.toNumericOrNull(change.before);
    const afterNum = this.toNumericOrNull(change.after);

    if (
      beforeNum === undefined ||
      afterNum === undefined ||
      (beforeNum === null && afterNum === null)
    ) {
      return null;
    }

    return Number(((afterNum ?? 0) - (beforeNum ?? 0)).toFixed(2));
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
          const num = this.toNumericOrNull(value(change));
          return total + (typeof num === 'number' ? num : 0);
        }, 0)
        .toFixed(2),
    );
  }

  private toNumericOrNull(
    value: ChangeEntry['before'],
  ): number | null | undefined {
    if (value === null) {
      return null;
    }
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    if (
      typeof value === 'string' &&
      value.trim() !== '' &&
      !isNaN(Number(value))
    ) {
      return Number(value);
    }
    return undefined;
  }
}
