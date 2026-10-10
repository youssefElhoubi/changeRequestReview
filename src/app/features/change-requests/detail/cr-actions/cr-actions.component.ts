import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { ChangeRequest } from '../../models/change-request.models';

@Component({
  selector: 'app-cr-actions',
  templateUrl: './cr-actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrActionsComponent {
  @Input() changeRequest: ChangeRequest | null = null;
  @Input() canApprove = false;
  @Input() canReject = false;
  @Input() actionInFlight = false;
  @Output() readonly approve = new EventEmitter<ChangeRequest>();
  @Output() readonly reject = new EventEmitter<{
    changeRequest: ChangeRequest;
    reason: string;
  }>();

  reason = '';
  validationMessage = '';

  onApprove(): void {
    if (this.changeRequest && this.canApprove && !this.actionInFlight) {
      this.approve.emit(this.changeRequest);
    }
  }

  onReject(): void {
    if (!this.changeRequest || !this.canReject || this.actionInFlight) {
      return;
    }
    if (!this.reason.trim()) {
      this.validationMessage = 'A rejection reason is required.';
      return;
    }
    this.validationMessage = '';
    this.reject.emit({
      changeRequest: this.changeRequest,
      reason: this.reason,
    });
  }
}
