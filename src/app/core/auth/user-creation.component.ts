import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { UserManagementService } from './user-management.service';
import { MIN_PASSWORD_LENGTH, PASSWORD_PATTERN } from './credential-validation';
import {
  DEFAULT_NEW_USER_ROLE,
  PERMISSION_OPTIONS,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_OPTIONS,
  User,
  UserPermission,
  UserRole,
} from '../../features/change-requests/models/change-request.models';

@Component({
  selector: 'app-user-creation',
  templateUrl: './user-creation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCreationComponent {
  showPassword = false;
  isEditMode = false;
  editingUserId: string | null = null;

  readonly roleOptions = ROLE_OPTIONS;
  readonly permissionOptions = PERMISSION_OPTIONS;

  readonly form = this.formBuilder.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(MIN_PASSWORD_LENGTH),
        Validators.pattern(PASSWORD_PATTERN),
      ],
    ],
    role: this.formBuilder.control<UserRole>(DEFAULT_NEW_USER_ROLE, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    permissions: this.formBuilder.control<UserPermission[]>(
      [...ROLE_DEFAULT_PERMISSIONS[DEFAULT_NEW_USER_ROLE]],
      {
        nonNullable: true,
        validators: [
          (control) =>
            control.value && control.value.length > 0
              ? null
              : { required: true },
        ],
      },
    ),
  });

  readonly creationState$ = this.userManagement.creationState$;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly userManagement: UserManagementService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  onRoleChange(newRole: string): void {
    const role = newRole as UserRole;
    const defaults =
      ROLE_DEFAULT_PERMISSIONS[role] ??
      ROLE_DEFAULT_PERMISSIONS[DEFAULT_NEW_USER_ROLE];
    this.form.controls.permissions.setValue([...defaults]);
  }

  isPermissionSelected(permission: UserPermission): boolean {
    const permissions = this.form.controls.permissions.value ?? [];
    return permissions.includes(permission);
  }

  togglePermission(permission: UserPermission, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = new Set(this.form.controls.permissions.value ?? []);
    if (checked) {
      current.add(permission);
    } else {
      current.delete(permission);
    }
    this.form.controls.permissions.setValue(Array.from(current));
    this.form.controls.permissions.markAsTouched();
  }

  getRoleLabel(role: UserRole | string | null | undefined): string {
    const found = this.roleOptions.find((r) => r.value === role);
    return found ? found.label : 'Viewer';
  }

  loadUser(user: User): void {
    this.isEditMode = true;
    this.editingUserId = user.id;
    this.form.controls.name.setValue(user.name);
    this.form.controls.email.setValue(user.email ?? '');
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.form.controls.role.setValue(user.role);
    this.form.controls.permissions.setValue([...user.permissions]);
    this.cdr.markForCheck();
  }

  submit(): void {
    if (this.form.invalid || this.form.disabled) {
      this.form.markAllAsTouched();
      return;
    }

    this.form.disable();
    const { name, email, password, role, permissions } =
      this.form.getRawValue();

    if (this.isEditMode && this.editingUserId) {
      this.userManagement
        .updateUser(this.editingUserId, {
          role: role as UserRole,
          permissions: permissions as UserPermission[],
        })
        .subscribe({
          next: () => {
            this.form.enable();
          },
          error: () => this.form.enable(),
        });
      return;
    }

    this.userManagement
      .createUser({
        name: name ?? '',
        email: email ?? '',
        password: password ?? '',
        role: role as UserRole,
        permissions: permissions as UserPermission[],
      })
      .subscribe({
        next: () => {
          this.form.reset({
            name: '',
            email: '',
            password: '',
            role: DEFAULT_NEW_USER_ROLE,
            permissions: [...ROLE_DEFAULT_PERMISSIONS[DEFAULT_NEW_USER_ROLE]],
          });
          this.form.enable();
        },
        error: () => this.form.enable(),
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  cancel(): void {
    void this.router.navigate(['/change-requests']);
  }
}
