import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { UserCreationState } from '../../features/change-requests/models/change-request.models';
import { UserManagementService } from './user-management.service';
import { UserCreationComponent } from './user-creation.component';

describe('UserCreationComponent', () => {
  let fixture: ComponentFixture<UserCreationComponent>;
  let creationState$: BehaviorSubject<UserCreationState>;
  let userManagement: {
    creationState$: typeof creationState$;
    createUser: jest.Mock;
  };

  beforeEach(async () => {
    creationState$ = new BehaviorSubject<UserCreationState>({
      status: 'idle',
      user: null,
      error: null,
    });
    userManagement = {
      creationState$,
      createUser: jest.fn(() => of({ id: 'u-new', name: 'New User' })),
    };
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [UserCreationComponent],
      providers: [
        { provide: UserManagementService, useValue: userManagement },
        { provide: Router, useValue: { navigate: jest.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UserCreationComponent);
    fixture.detectChanges();
  });

  it('renders exactly the three business fields', () => {
    const inputs = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
    ) as HTMLInputElement[];
    expect(inputs.map((input) => input.id)).toEqual([
      'user-name',
      'user-email',
      'user-password',
    ]);
  });

  it('shows success feedback and toggles the password field', () => {
    fixture.componentInstance.form.setValue({
      name: 'New User',
      email: 'new@example.com',
      password: 'StrongPass1',
    });
    fixture.componentInstance.submit();
    creationState$.next({
      status: 'success',
      user: {
        id: 'u-new',
        name: 'New User',
        passeord: 'StrongPass1',
        role: 'viewer',
        permissions: [],
      },
      error: null,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'User created successfully.',
    );
    const password = fixture.nativeElement.querySelector(
      '#user-password',
    ) as HTMLInputElement;
    fixture.nativeElement.querySelector('[aria-label="Show password"]').click();
    fixture.detectChanges();
    expect(password.type).toBe('text');
  });

  it('matches the workspace creation hierarchy and exposes the three fields', () => {
    expect(fixture.nativeElement.textContent).toContain(
      'Give the right people the right access.',
    );
    expect(fixture.nativeElement.textContent).toContain('Thoughtful access');
    expect(
      fixture.nativeElement.querySelector('#user-creation-title'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelectorAll('input').length,
    ).toBe(3);
  });

  it('shows the duplicate-email error from the creation service', () => {
    creationState$.next({
      status: 'error',
      user: null,
      error: {
        code: 'DUPLICATE_EMAIL',
        message: 'A user with this email already exists.',
      },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'A user with this email already exists.',
    );
    expect(
      fixture.nativeElement.querySelector('[role="alert"]'),
    ).not.toBeNull();
  });
});
