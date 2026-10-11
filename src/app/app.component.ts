import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

import { UserPermission } from './features/change-requests/models/change-request.models';
import { AuthService, AuthenticationState } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly authState$ = this.authService.state$;
  readonly viewPermission = UserPermission.ViewChangeRequests;
  readonly createPermission = UserPermission.CreateChangeRequests;
  isNavigationOpen = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  canCreateUsers(state: AuthenticationState): boolean {
    return state.user?.role === 'approver';
  }

  canCreateRequests(state: AuthenticationState): boolean {
    return (
      state.user?.permissions.includes(UserPermission.CreateChangeRequests) ??
      false
    );
  }

  currentPageContext(): string {
    const url = this.router.url;

    if (url.includes('/create')) {
      return url.includes('/users') ? 'Create user' : 'New request';
    }

    if (url.includes('/my-requests')) {
      return 'My requests';
    }

    if (url.startsWith('/change-requests/')) {
      return 'Request details';
    }

    return 'Change requests';
  }

  toggleNavigation(): void {
    this.isNavigationOpen = !this.isNavigationOpen;
  }

  closeNavigation(): void {
    this.isNavigationOpen = false;
  }

  logout(): void {
    this.closeNavigation();
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
