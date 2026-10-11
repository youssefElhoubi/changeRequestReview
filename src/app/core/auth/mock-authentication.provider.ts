import { Injectable } from '@angular/core';

import {
  ALL_USER_PERMISSIONS,
  ALL_USER_ROLES,
  AuthenticationResult,
  CreateUserInput,
  DEFAULT_NEW_USER_PERMISSIONS,
  DEFAULT_NEW_USER_ROLE,
  LoginCredentials,
  ROLE_DEFAULT_PERMISSIONS,
  User,
  UserPermission,
  UserRole,
} from '../../features/change-requests/models/change-request.models';
import { MockDataStorageService } from '../api/mock-data-storage.service';
import { AuthenticationProvider } from './authentication-provider';
import { AuditLogService } from './audit-log.service';
import {
  normalizeEmail,
  validateCreateUserInput,
  validateLoginCredentials,
} from './credential-validation';

const MOCK_SESSION_TOKEN_KEY = 'change-request-review.mock-session-token';
const MOCK_SESSION_USER_ID_KEY = 'change-request-review.mock-session-user-id';

@Injectable()
export class MockAuthenticationProvider extends AuthenticationProvider {
  constructor(
    private readonly storage: MockDataStorageService,
    private readonly auditLog: AuditLogService,
  ) {
    super();
  }

  async login(credentials: LoginCredentials): Promise<AuthenticationResult> {
    if (!validateLoginCredentials(credentials)) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const normalizedEmail = normalizeEmail(credentials.email);
    const user = this.storage
      .getUsers()
      .find(
        (candidate) =>
          candidate.email &&
          normalizeEmail(candidate.email) === normalizedEmail,
      );

    if (
      !user ||
      !(await this.isValidMockPassword(user, credentials.password))
    ) {
      throw new Error('INVALID_CREDENTIALS');
    }

    return this.createSession(user);
  }

  async createUser(input: CreateUserInput): Promise<User> {
    if (validateCreateUserInput(input)) {
      throw new Error('INVALID_INPUT');
    }

    const actorId = this.getActorUserId();
    const actor = this.storage
      .getUsers()
      .find((candidate) => candidate.id === actorId);
    if (!actor || actor.role !== 'approver') {
      this.recordCreateFailure(
        input.email,
        'Unauthorized attempt to create a user: actor must have the approver role.',
      );
      throw new Error('UNAUTHORIZED');
    }

    const email = normalizeEmail(input.email);
    const users = this.storage.getUsers();
    if (
      users.some(
        (candidate) =>
          candidate.email && normalizeEmail(candidate.email) === email,
      )
    ) {
      this.recordCreateFailure(
        email,
        'User creation rejected because the email is already registered.',
      );
      throw new Error('DUPLICATE_EMAIL');
    }

    const role = input.role ?? DEFAULT_NEW_USER_ROLE;
    const permissions = input.permissions
      ? [...input.permissions]
      : [...(ROLE_DEFAULT_PERMISSIONS[role] ?? DEFAULT_NEW_USER_PERMISSIONS)];

    const user: User = {
      id: this.createUserId(),
      name: input.name.trim(),
      email,
      passeord: input.password,
      role,
      permissions,
    };
    this.storage.saveUsers([...users, user]);
    try {
      this.auditLog.record({
        actorUserId: this.getActorUserId(),
        action: 'user.created',
        targetUserId: user.id,
        description: `Created a ${user.role} user with ${user.permissions.length} permission(s).`,
        outcome: 'success',
        changedFields: ['name', 'email', 'role', 'permissions'],
      });
    } catch (error) {
      this.storage.saveUsers(users);
      throw error;
    }
    return user;
  }

  override async updateUser(
    userId: string,
    changes: { role?: UserRole; permissions?: UserPermission[] },
  ): Promise<User> {
    const actorId = this.getActorUserId();
    const actor = this.storage
      .getUsers()
      .find((candidate) => candidate.id === actorId);
    if (!actor || actor.role !== 'approver') {
      throw new Error('UNAUTHORIZED');
    }

    const users = this.storage.getUsers();
    const user = users.find((candidate) => candidate.id === userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (changes.role !== undefined && ALL_USER_ROLES.includes(changes.role)) {
      user.role = changes.role;
    }
    if (
      changes.permissions !== undefined &&
      Array.isArray(changes.permissions)
    ) {
      user.permissions = changes.permissions.filter((p) =>
        ALL_USER_PERMISSIONS.includes(p),
      );
    }

    this.storage.saveUsers(users);
    this.auditLog.record({
      actorUserId: actorId,
      action: 'user.updated',
      targetUserId: user.id,
      description: `Updated role and permissions for user ${user.id}.`,
      outcome: 'success',
      changedFields: ['role', 'permissions'],
    });
    return user;
  }

  async restore(): Promise<AuthenticationResult | null> {
    const token = sessionStorage.getItem(MOCK_SESSION_TOKEN_KEY);
    const userId = sessionStorage.getItem(MOCK_SESSION_USER_ID_KEY);
    if (!token || !userId) {
      sessionStorage.removeItem(MOCK_SESSION_TOKEN_KEY);
      sessionStorage.removeItem(MOCK_SESSION_USER_ID_KEY);
      return null;
    }

    let user: User;
    try {
      user = this.storage.getUserById(userId);
    } catch {
      sessionStorage.removeItem(MOCK_SESSION_TOKEN_KEY);
      sessionStorage.removeItem(MOCK_SESSION_USER_ID_KEY);
      return null;
    }

    this.storage.setCurrentUserId(user.id);
    return { user, sessionToken: token };
  }

  logout(): void {
    if (sessionStorage.getItem(MOCK_SESSION_TOKEN_KEY)) {
      sessionStorage.removeItem(MOCK_SESSION_TOKEN_KEY);
    }
    sessionStorage.removeItem(MOCK_SESSION_USER_ID_KEY);
  }

  private createSession(user: User): AuthenticationResult {
    const token = this.createToken();
    sessionStorage.setItem(MOCK_SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(MOCK_SESSION_USER_ID_KEY, user.id);
    this.storage.setCurrentUserId(user.id);
    return { user, sessionToken: token };
  }

  private async isValidMockPassword(
    user: User,
    password: string,
  ): Promise<boolean> {
    if (!user.email) {
      return false;
    }
    return user.passeord === password;
  }

  private createUserId(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return `u-${globalThis.crypto.randomUUID()}`;
    }
    return `u-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private createToken(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private recordCreateFailure(email: string, description: string): void {
    this.auditLog.record({
      actorUserId: this.getActorUserId(),
      action: 'user.create_failed',
      targetUserId: email,
      description,
      outcome: 'failure',
    });
  }

  private getActorUserId(): string {
    try {
      return this.storage.getCurrentUserId();
    } catch {
      return 'unknown';
    }
  }
}
