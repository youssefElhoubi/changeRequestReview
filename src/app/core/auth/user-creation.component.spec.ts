import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import {
  User,
  UserCreationState,
  UserPermission,
} from '../../features/change-requests/models/change-request.models';
import { UserManagementService } from './user-management.service';
import { UserCreationComponent } from './user-creation.component';

describe('UserCreationComponent', () => {
  let fixture: ComponentFixture<UserCreationComponent>;
  let creationState$: BehaviorSubject<UserCreationState>;
  let userManagement: {
    creationState$: typeof creationState$;
    createUser: jest.Mock;
    updateUser: jest.Mock;
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
      updateUser: jest.fn(() => of({ id: 'u-edit', name: 'Edit User' })),
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

  it('renders name, email, password, role dropdown, and permission checkboxes', () => {
    expect(fixture.nativeElement.querySelector('#user-name')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#user-email')).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('#user-password'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#user-role')).not.toBeNull();

    const roleSelect = fixture.nativeElement.querySelector(
      '#user-role',
    ) as HTMLSelectElement;
    expect(Array.from(roleSelect.options).map((opt) => opt.value)).toEqual([
      'viewer',
      'requester',
      'approver',
    ]);

    const checkboxes = fixture.nativeElement.querySelectorAll(
      'input[type="checkbox"]',
    );
    expect(checkboxes.length).toBe(4);
  });

  it('shows success feedback and toggles the password field', () => {
    fixture.componentInstance.form.setValue({
      name: 'New User',
      email: 'new@example.com',
      password: 'StrongPass1',
      role: 'viewer',
      permissions: [UserPermission.ViewChangeRequests],
    });
    fixture.componentInstance.submit();
    creationState$.next({
      status: 'success',
      user: {
        id: 'u-new',
        name: 'New User',
        passeord: 'StrongPass1',
        role: 'viewer',
        permissions: [UserPermission.ViewChangeRequests],
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

  it('submits with selected role and customized permissions', () => {
    fixture.componentInstance.form.controls.name.setValue('Approver User');
    fixture.componentInstance.form.controls.email.setValue(
      'approver@example.com',
    );
    fixture.componentInstance.form.controls.password.setValue('StrongPass1');
    fixture.componentInstance.form.controls.role.setValue('approver');
    fixture.componentInstance.onRoleChange('approver');

    // Deselect reject permission to customize
    const rejectCheckbox = fixture.nativeElement.querySelector(
      '#perm-reject_change_requests',
    ) as HTMLInputElement;
    rejectCheckbox.checked = false;
    rejectCheckbox.dispatchEvent(new Event('change'));

    fixture.componentInstance.submit();

    expect(userManagement.createUser).toHaveBeenCalledWith({
      name: 'Approver User',
      email: 'approver@example.com',
      password: 'StrongPass1',
      role: 'approver',
      permissions: [
        UserPermission.ViewChangeRequests,
        UserPermission.ApproveChangeRequests,
      ],
    });
  });

  it('updates default permissions when the role changes', () => {
    fixture.componentInstance.onRoleChange('requester');
    expect(fixture.componentInstance.form.controls.permissions.value).toEqual([
      UserPermission.ViewChangeRequests,
      UserPermission.CreateChangeRequests,
    ]);

    fixture.componentInstance.onRoleChange('approver');
    expect(fixture.componentInstance.form.controls.permissions.value).toEqual([
      UserPermission.ViewChangeRequests,
      UserPermission.ApproveChangeRequests,
      UserPermission.RejectChangeRequests,
    ]);
  });

  it('loads an existing user and retains their saved permissions without resetting', () => {
    const existingUser: User = {
      id: 'u-custom',
      name: 'Custom Approver',
      email: 'custom@example.com',
      passeord: 'Dev123!ChangeMe',
      role: 'approver',
      // Custom permissions: only View and Approve, no Reject
      permissions: [
        UserPermission.ViewChangeRequests,
        UserPermission.ApproveChangeRequests,
      ],
    };

    fixture.componentInstance.loadUser(existingUser);
    fixture.detectChanges();

    expect(fixture.componentInstance.isEditMode).toBe(true);
    expect(fixture.componentInstance.form.controls.role.value).toBe('approver');
    expect(fixture.componentInstance.form.controls.permissions.value).toEqual([
      UserPermission.ViewChangeRequests,
      UserPermission.ApproveChangeRequests,
    ]);
    expect(fixture.nativeElement.textContent).toContain('Edit user');
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
