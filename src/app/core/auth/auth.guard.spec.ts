import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

import { AuthenticationState, AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { UserPermission } from '../../features/change-requests/models/change-request.models';

describe('AuthGuard', () => {
  const user = {
    id: 'u-alice',
    name: 'Alice',
    passeord: 'Dev123!ChangeMe',
    role: 'approver' as const,
    permissions: [UserPermission.ViewChangeRequests],
  };
  const route = (data: Record<string, unknown> = {}) =>
    ({ data }) as ActivatedRouteSnapshot;
  const state = (url: string) => ({ url }) as RouterStateSnapshot;

  function createGuard(authState$: BehaviorSubject<AuthenticationState>) {
    const authService = { state$: authState$.asObservable() } as AuthService;
    const router = {
      createUrlTree: jest.fn((commands: unknown[], extras?: unknown) => ({
        commands,
        extras,
      })),
    };
    return {
      guard: new AuthGuard(authService, router as never),
      router,
    };
  }

  it('waits for session restoration before evaluating access', async () => {
    const authState$ = new BehaviorSubject<AuthenticationState>({
      status: 'loading',
      user: null,
      error: null,
    });
    const { guard } = createGuard(authState$);
    const result$ = guard.canActivate(
      route({ permission: UserPermission.ViewChangeRequests }),
      state('/change-requests'),
    );
    let settled = false;
    result$.subscribe(() => (settled = true));

    expect(settled).toBe(false);
    authState$.next({
      status: 'authenticated',
      user,
      error: null,
    });
    expect(await firstValueFrom(result$)).toBe(true);
  });

  it('redirects unauthenticated users to login with the intended URL', async () => {
    const authState$ = new BehaviorSubject<AuthenticationState>({
      status: 'unauthenticated',
      user: null,
      error: null,
    });
    const { guard, router } = createGuard(authState$);

    await firstValueFrom(
      guard.canActivate(
        route({ permission: UserPermission.ViewChangeRequests }),
        state('/change-requests/cr-1001'),
      ),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/change-requests/cr-1001' },
    });
  });

  it('allows an authenticated user with the required permission', async () => {
    const authState$ = new BehaviorSubject<AuthenticationState>({
      status: 'authenticated',
      user,
      error: null,
    });
    const { guard } = createGuard(authState$);

    expect(
      await firstValueFrom(
        guard.canActivate(
          route({ permission: UserPermission.ViewChangeRequests }),
          state('/change-requests'),
        ),
      ),
    ).toBe(true);
  });

  it('redirects authenticated users without permission to forbidden', async () => {
    const authState$ = new BehaviorSubject<AuthenticationState>({
      status: 'authenticated',
      user,
      error: null,
    });
    const { guard, router } = createGuard(authState$);

    await firstValueFrom(
      guard.canActivate(
        route({ permission: UserPermission.ApproveChangeRequests }),
        state('/restricted'),
      ),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/forbidden']);
  });
});
