import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, from, Observable, Subject, throwError } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';

import {
  AuthenticationError,
  AuthenticationStatus,
  LoginCredentials,
  User,
  UserPermission,
  UserRole,
} from '../../features/change-requests/models/change-request.models';
import { MockDataStorageService } from '../api/mock-data-storage.service';
import { AuthenticationProvider } from './authentication-provider';

export interface AuthenticationState {
  status: AuthenticationStatus;
  user: User | null;
  error: AuthenticationError | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly stateSubject = new BehaviorSubject<AuthenticationState>({
    status: 'loading',
    user: null,
    error: null,
  });
  private operationVersion = 0;

  readonly state$ = this.stateSubject.asObservable();
  readonly currentUser$ = this.state$.pipe(
    map((state) => state.user),
    takeUntil(this.destroy$),
  );

  constructor(
    private readonly storage: MockDataStorageService,
    private readonly provider: AuthenticationProvider,
  ) {
    void this.restoreSession();
  }

  get currentUser(): User {
    return this.storage.getUserById(this.currentUserIdValue);
  }

  get currentUserIdValue(): string {
    return this.storage.getCurrentUserId();
  }

  hasPermission(permission: UserPermission): boolean {
    return this.currentUser.permissions.includes(permission);
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser.role === role;
  }

  setCurrentUser(userId: string): void {
    this.operationVersion += 1;
    this.storage.setCurrentUserId(userId);
    this.stateSubject.next({
      status: 'unauthenticated',
      user: null,
      error: null,
    });
  }

  getUsers(): User[] {
    return this.storage.getUsers();
  }

  login(credentials: LoginCredentials): Observable<User> {
    this.operationVersion += 1;
    this.stateSubject.next({
      status: 'loading',
      user: null,
      error: null,
    });

    return from(this.provider.login(credentials)).pipe(
      map((result) => {
        this.stateSubject.next({
          status: 'authenticated',
          user: result.user,
          error: null,
        });
        return result.user;
      }),
      catchError((error: unknown) => {
        const authError = this.toAuthenticationError(error);
        this.stateSubject.next({
          status: 'error',
          user: null,
          error: authError,
        });
        return throwError(() => authError);
      }),
    );
  }

  logout(): void {
    this.operationVersion += 1;
    this.provider.logout();
    this.stateSubject.next({
      status: 'unauthenticated',
      user: null,
      error: null,
    });
  }

  private async restoreSession(): Promise<void> {
    const versionAtStart = this.operationVersion;
    try {
      const result = await this.provider.restore();
      if (versionAtStart !== this.operationVersion) {
        return;
      }
      this.stateSubject.next({
        status: result ? 'authenticated' : 'unauthenticated',
        user: result?.user ?? null,
        error: null,
      });
    } catch {
      if (versionAtStart !== this.operationVersion) {
        return;
      }
      this.stateSubject.next({
        status: 'error',
        user: null,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Your session could not be restored. Please sign in again.',
        },
      });
    }
  }

  private toAuthenticationError(error: unknown): AuthenticationError {
    if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
      return {
        code: 'INVALID_CREDENTIALS',
        message: 'The email or password is incorrect.',
      };
    }

    return {
      code: 'UNKNOWN',
      message: 'Unable to sign in. Please try again.',
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
