import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { UserManagementService } from './user-management.service';

@Component({
  selector: 'app-user-creation',
  templateUrl: './user-creation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCreationComponent {
  readonly form = this.formBuilder.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/),
      ],
    ],
  });

  readonly creationState$ = this.userManagement.creationState$;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly userManagement: UserManagementService,
    private readonly router: Router,
  ) {}

  submit(): void {
    if (this.form.invalid || this.form.disabled) {
      this.form.markAllAsTouched();
      return;
    }

    this.form.disable();
    const { name, email, password } = this.form.getRawValue();
    this.userManagement
      .createUser({
        name: name ?? '',
        email: email ?? '',
        password: password ?? '',
      })
      .subscribe({
        next: () => {
          this.form.reset();
          this.form.enable();
        },
        error: () => this.form.enable(),
      });
  }

  cancel(): void {
    void this.router.navigate(['/change-requests']);
  }
}
