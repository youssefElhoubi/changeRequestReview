import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  readonly authState$ = this.authService.state$;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  submit(): void {
    if (this.form.invalid || this.form.disabled) {
      this.form.markAllAsTouched();
      return;
    }

    this.form.disable();
    const { email, password } = this.form.getRawValue();
    this.authService
      .login({ email: email ?? '', password: password ?? '' })
      .subscribe({
        next: () => {
          const returnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl') ??
            '/change-requests';
          void this.router.navigateByUrl(this.safeReturnUrl(returnUrl));
          this.form.reset();
          this.form.enable();
        },
        error: () => this.form.enable(),
      });
  }

  private safeReturnUrl(returnUrl: string): string {
    return returnUrl.startsWith('/') && !returnUrl.startsWith('//')
      ? returnUrl
      : '/change-requests';
  }
}
