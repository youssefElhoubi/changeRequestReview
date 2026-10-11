import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { AppComponent } from './app.component';
import { AuthService, AuthenticationState } from './core/auth/auth.service';
import { UserPermission } from './features/change-requests/models/change-request.models';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let authState$: BehaviorSubject<AuthenticationState>;
  let auth: { state$: typeof authState$; logout: jest.Mock };
  let router: Router;

  beforeEach(async () => {
    authState$ = new BehaviorSubject<AuthenticationState>({
      status: 'loading',
      user: null,
      error: null,
    });
    auth = {
      state$: authState$,
      logout: jest.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent],
      providers: [{ provide: AuthService, useValue: auth }],
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('should create the app', () => {
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('holds protected content behind session restoration', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Restoring your session...',
    );
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeNull();

    authState$.next({
      status: 'authenticated',
      user: {
        id: 'u-alice',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'approver',
        permissions: [UserPermission.ViewChangeRequests],
      },
      error: null,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Signed in as Alice');
    expect(fixture.nativeElement.textContent).toContain('Create user');
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });

  it('shows public content without authenticated navigation', () => {
    authState$.next({ status: 'unauthenticated', user: null, error: null });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('nav')).toBeNull();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });

  it('logs out and returns to the public login route', () => {
    fixture.componentInstance.logout();

    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
