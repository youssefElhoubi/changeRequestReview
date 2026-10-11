import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import {
  UserPermission,
  UserRole,
} from '../../features/change-requests/models/change-request.models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> {
    return this.authService.state$.pipe(
      filter((authState) => authState.status !== 'loading'),
      take(1),
      map((authState) => {
        if (authState.status !== 'authenticated' || !authState.user) {
          return this.router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          });
        }

        const requiredPermission = route.data['permission'] as
          UserPermission | undefined;
        const requiredRole = route.data['role'] as UserRole | undefined;
        if (
          (requiredPermission &&
            !authState.user.permissions.includes(requiredPermission)) ||
          (requiredRole && authState.user.role !== requiredRole)
        ) {
          return this.router.createUrlTree(['/forbidden']);
        }

        return true;
      }),
    );
  }
}
