import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { ChangeRequestService } from '../data/change-request.service';
import { ChangeRequest } from '../models/change-request.models';

type CreateState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-cr-create',
  templateUrl: './cr-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrCreateComponent {
  readonly form = this.formBuilder.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    changes: this.formBuilder.array([this.createChangeGroup()]),
  });

  private readonly stateSubject = new BehaviorSubject<CreateState>('idle');
  readonly state$ = this.stateSubject.asObservable();
  errorMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly service: ChangeRequestService,
    private readonly router: Router,
  ) {}

  get changes(): FormArray {
    return this.form.get('changes') as FormArray;
  }

  addChange(): void {
    this.changes.push(this.createChangeGroup());
  }

  removeChange(index: number): void {
    if (this.changes.length > 1) {
      this.changes.removeAt(index);
    }
  }

  submit(): void {
    if (this.form.invalid || this.stateSubject.value === 'loading') {
      this.form.markAllAsTouched();
      return;
    }

    this.stateSubject.next('loading');
    this.errorMessage = '';
    this.form.disable();

    const value = this.form.getRawValue();
    this.service
      .create({
        title: value.title ?? '',
        description: value.description ?? '',
        changes: (value.changes ?? []).map(
          (change: Record<string, string>) => ({
            field: change['field'] ?? '',
            before: change['before'] || null,
            after: change['after'] || null,
          }),
        ),
      })
      .subscribe({
        next: (created: ChangeRequest) => {
          this.stateSubject.next('success');
          this.form.reset();
          this.form.enable();
          void this.router.navigate(['/change-requests', created.id]);
        },
        error: () => {
          this.stateSubject.next('error');
          this.errorMessage =
            'Unable to create the change request. Please try again.';
          this.form.enable();
        },
      });
  }

  cancel(): void {
    void this.router.navigate(['/change-requests']);
  }

  private createChangeGroup(): FormGroup {
    return this.formBuilder.group({
      field: ['', [Validators.required]],
      before: [''],
      after: [''],
    });
  }
}
