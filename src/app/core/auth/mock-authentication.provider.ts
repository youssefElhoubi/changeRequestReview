import { Injectable } from '@angular/core';

import {
  AuthenticationResult,
  CreateUserInput,
  DEFAULT_NEW_USER_PERMISSIONS,
  DEFAULT_NEW_USER_ROLE,
  LoginCredentials,
  User,
} from '../../features/change-requests/models/change-request.models';
import { MockDataStorageService } from '../api/mock-data-storage.service';
import { MOCK_USER_PASSWORDS } from '../api/mock-data';
import { AuthenticationProvider } from './authentication-provider';
import { AuditLogService } from './audit-log.service';
import {
  normalizeEmail,
  validateCreateUserInput,
  validateLoginCredentials,
} from './credential-validation';

const MOCK_SESSION_TOKEN_KEY = 'change-request-review.mock-session-token';
const activeSessions = new Map<string, string>();
const passwordDigests = new Map<string, string>();

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

    const user: User = {
      id: this.createUserId(),
      name: input.name.trim(),
      email,
      role: DEFAULT_NEW_USER_ROLE,
      permissions: [...DEFAULT_NEW_USER_PERMISSIONS],
    };
    this.storage.saveUsers([...users, user]);
    try {
      passwordDigests.set(email, await hashPassword(input.password));
      this.auditLog.record({
        actorUserId: this.getActorUserId(),
        action: 'user.created',
        targetUserId: user.id,
        description: 'Created a viewer user with view-only access.',
        outcome: 'success',
        changedFields: ['name', 'email', 'role', 'permissions'],
      });
    } catch (error) {
      passwordDigests.delete(email);
      this.storage.saveUsers(users);
      throw error;
    }
    return user;
  }

  async restore(): Promise<AuthenticationResult | null> {
    const token = sessionStorage.getItem(MOCK_SESSION_TOKEN_KEY);
    if (!token) {
      return null;
    }

    const userId = activeSessions.get(token);
    if (!userId) {
      sessionStorage.removeItem(MOCK_SESSION_TOKEN_KEY);
      return null;
    }

    const user = this.storage.getUserById(userId);
    return { user, sessionToken: token };
  }

  logout(): void {
    const token = sessionStorage.getItem(MOCK_SESSION_TOKEN_KEY);
    if (token) {
      activeSessions.delete(token);
      sessionStorage.removeItem(MOCK_SESSION_TOKEN_KEY);
    }
  }

  private createSession(user: User): AuthenticationResult {
    const token = this.createToken();
    activeSessions.set(token, user.id);
    sessionStorage.setItem(MOCK_SESSION_TOKEN_KEY, token);
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
    const storedDigest = passwordDigests.get(normalizeEmail(user.email));
    if (storedDigest) {
      return storedDigest === (await hashPassword(password));
    }
    return MOCK_USER_PASSWORDS[user.id] === password;
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

async function hashPassword(password: string): Promise<string> {
  const bytes = new Uint8Array(
    password.split('').map((character) => character.charCodeAt(0)),
  );
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    let hash = 2166136261;
    bytes.forEach((byte) => {
      hash ^= byte;
      hash = Math.imul(hash, 16777619);
    });
    return `mock-${(hash >>> 0).toString(16)}`;
  }
  const digest = await subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}
