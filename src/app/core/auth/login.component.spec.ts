import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';

import { AuthService, AuthenticationState } from './auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let authState$: BehaviorSubject<AuthenticationState>;
  let auth: { state$: typeof authState$; login: jest.Mock };

  beforeEach(async () => {
    authState$ = new BehaviorSubject<AuthenticationState>({
      status: 'unauthenticated',
      user: null,
      error: null,
    });
    auth = {
      state$: authState$,
      login: jest.fn(() => of({ id: 'u-alice', name: 'Alice' })),
    };
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: () => '/change-requests' } },
          },
        },
        { provide: Router, useValue: { navigateByUrl: jest.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  it('shows field validation and toggles password visibility', () => {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Enter a valid email address.',
    );
    const password = fixture.nativeElement.querySelector(
      '#login-password',
    ) as HTMLInputElement;
    expect(password.type).toBe('password');
    fixture.nativeElement.querySelector('[aria-label="Show password"]').click();
    fixture.detectChanges();
    expect(password.type).toBe('text');
  });

  it('disables the form during login and reports service errors', () => {
    auth.login.mockReturnValue(new Subject());
    fixture.componentInstance.form.setValue({
      email: 'alice@example.com',
      password: 'secret',
    });
    fixture.componentInstance.submit();
    authState$.next({ status: 'loading', user: null, error: null });
    fixture.detectChanges();

    expect(auth.login).toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('button[type="submit"]').textContent,
    ).toContain('Signing in...');

    authState$.next({
      status: 'error',
      user: null,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'The email or password is incorrect.',
      },
    });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]'),
    ).not.toBeNull();
  });
});
