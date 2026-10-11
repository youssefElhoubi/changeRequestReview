import { TestBed } from '@angular/core/testing';

import { MockDataStorageService } from '../api/mock-data-storage.service';
import { MockAuthenticationProvider } from './mock-authentication.provider';
import { AuditLogService } from './audit-log.service';

describe('MockAuthenticationProvider user creation', () => {
  let provider: MockAuthenticationProvider;
  let storage: MockDataStorageService;
  let auditLog: AuditLogService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [MockDataStorageService, MockAuthenticationProvider],
    });
    storage = TestBed.inject(MockDataStorageService);
    auditLog = TestBed.inject(AuditLogService);
    provider = TestBed.inject(MockAuthenticationProvider);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    auditLog.clear();
    TestBed.resetTestingModule();
  });

  it('creates a viewer with only view permission and no password field', async () => {
    const user = await provider.createUser({
      name: 'New User',
      email: ' NEW@example.com ',
      password: 'StrongPass1',
    });

    expect(user).toMatchObject({
      name: 'New User',
      email: 'new@example.com',
      role: 'viewer',
      permissions: ['view_change_requests'],
    });
    expect(user).not.toHaveProperty('password');
    expect(JSON.stringify(storage.getUsers())).not.toContain('StrongPass1');
    expect(auditLog.getLogs()).toEqual([
      expect.objectContaining({
        actorUserId: 'u-alice',
        action: 'user.created',
        targetUserId: user.id,
        outcome: 'success',
        changedFields: ['name', 'email', 'role', 'permissions'],
      }),
    ]);
  });

  it.each([
    ['alice@example.com', 'u-alice'],
    ['bob@example.com', 'u-bob'],
    ['carol@example.com', 'u-carol'],
  ])(
    'authenticates seeded user %s with the development password',
    async (email) => {
      const result = await provider.login({
        email,
        password: 'Dev123!ChangeMe',
      });

      expect(result.user.email).toBe(email);
    },
  );

  it('rejects an incorrect password for a seeded user', async () => {
    await expect(
      provider.login({
        email: 'alice@example.com',
        password: 'mock-u-alice',
      }),
    ).rejects.toThrow('INVALID_CREDENTIALS');
  });

  it.each([
    { name: '', email: 'new@example.com', password: 'StrongPass1' },
    { name: 'New User', email: '', password: 'StrongPass1' },
    { name: 'New User', email: 'new@example.com', password: '' },
  ])('rejects incomplete user credentials', async (input) => {
    await expect(provider.createUser(input)).rejects.toThrow('INVALID_INPUT');
    expect(
      storage.getUsers().some((user) => user.email === 'new@example.com'),
    ).toBe(false);
  });

  it('rejects duplicate emails after normalization', async () => {
    await expect(
      provider.createUser({
        name: 'Duplicate',
        email: ' ALICE@EXAMPLE.COM ',
        password: 'StrongPass1',
      }),
    ).rejects.toThrow('DUPLICATE_EMAIL');
    expect(auditLog.getLogs()).toEqual([
      expect.objectContaining({
        actorUserId: 'u-alice',
        action: 'user.create_failed',
        targetUserId: 'alice@example.com',
        outcome: 'failure',
      }),
    ]);
  });

  it('authenticates a created user without persisting the plaintext password', async () => {
    await provider.createUser({
      name: 'New User',
      email: 'new@example.com',
      password: 'StrongPass1',
    });

    const result = await provider.login({
      email: 'NEW@example.com',
      password: 'StrongPass1',
    });

    expect(result.user.email).toBe('new@example.com');
    expect(JSON.stringify(localStorage)).not.toContain('StrongPass1');
  });

  it('does not leave a user behind when audit persistence fails', async () => {
    jest.spyOn(auditLog, 'record').mockImplementation(() => {
      throw new Error('audit unavailable');
    });

    await expect(
      provider.createUser({
        name: 'Rollback User',
        email: 'rollback@example.com',
        password: 'StrongPass1',
      }),
    ).rejects.toThrow('audit unavailable');

    expect(
      storage.getUsers().some((user) => user.email === 'rollback@example.com'),
    ).toBe(false);
  });
});
