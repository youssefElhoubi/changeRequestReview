import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, from, Observable, Subject, throwError } from 'rxjs';
import { catchError, finalize, map, takeUntil } from 'rxjs/operators';

import {
  CreateUserInput,
  User,
  UserCreationError,
  UserCreationState,
} from '../../features/change-requests/models/change-request.models';
import { AuthenticationProvider } from './authentication-provider';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable({
  providedIn: 'root',
})
export class UserManagementService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly stateSubject = new BehaviorSubject<UserCreationState>({
    status: 'idle',
    user: null,
    error: null,
  });
  private submitting = false;

  readonly creationState$ = this.stateSubject
    .asObservable()
    .pipe(takeUntil(this.destroy$));

  constructor(private readonly provider: AuthenticationProvider) {}

  createUser(input: CreateUserInput): Observable<User> {
    if (this.submitting) {
      return throwError(
        () =>
          ({
            code: 'INVALID_INPUT',
            message: 'A user is already being created.',
          }) satisfies UserCreationError,
      );
    }

    const validationError = this.validate(input);
    if (validationError) {
      this.stateSubject.next({
        status: 'error',
        user: null,
        error: validationError,
      });
      return throwError(() => validationError);
    }

    this.submitting = true;
    this.stateSubject.next({ status: 'loading', user: null, error: null });

    return from(this.provider.createUser(input)).pipe(
      map((user) => {
        this.stateSubject.next({ status: 'success', user, error: null });
        return user;
      }),
      catchError((error: unknown) => {
        const creationError = this.toCreationError(error);
        this.stateSubject.next({
          status: 'error',
          user: null,
          error: creationError,
        });
        return throwError(() => creationError);
      }),
      finalize(() => {
        this.submitting = false;
      }),
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private validate(input: CreateUserInput): UserCreationError | null {
    const name = input.name.trim();
    const email = input.email.trim();
    const password = input.password;

    if (!name || !EMAIL_PATTERN.test(email)) {
      return {
        code: 'INVALID_INPUT',
        message: 'Enter a name and a valid email address.',
      };
    }

    if (
      password.length < 8 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password)
    ) {
      return {
        code: 'INVALID_INPUT',
        message:
          'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
      };
    }

    return null;
  }

  private toCreationError(error: unknown): UserCreationError {
    if (error instanceof Error && error.message === 'DUPLICATE_EMAIL') {
      return {
        code: 'DUPLICATE_EMAIL',
        message: 'A user with this email already exists.',
      };
    }

    return {
      code: 'UNKNOWN',
      message: 'Unable to create the user. Please try again.',
    };
  }
}
