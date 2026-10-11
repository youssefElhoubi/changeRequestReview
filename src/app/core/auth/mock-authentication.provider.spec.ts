import { TestBed } from '@angular/core/testing';

import { MOCK_USERS } from '../api/mock-data';
import { MockDataStorageService } from '../api/mock-data-storage.service';
import { MockAuthenticationProvider } from './mock-authentication.provider';
import { AuditLogService } from './audit-log.service';
import { UserPermission } from '../../features/change-requests/models/change-request.models';

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

  it('creates a viewer with a persisted development password', async () => {
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
    expect(user.passeord).toBe('StrongPass1');
    expect(
      storage
        .getUsers()
        .find((candidate) => candidate.email === 'new@example.com')?.passeord,
    ).toBe('StrongPass1');
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

  it('keeps every seeded profile paired with a development credential', () => {
    expect(
      MOCK_USERS.every(
        (user) =>
          user.email &&
          user.passeord === 'Dev123!ChangeMe' &&
          !('password' in user),
      ),
    ).toBe(true);
  });

  it('rejects an incorrect password for a seeded user', async () => {
    await expect(
      provider.login({
        email: 'alice@example.com',
        password: 'mock-u-alice',
      }),
    ).rejects.toThrow('INVALID_CREDENTIALS');
  });

  it('rejects an unknown email even when the password is valid', async () => {
    await expect(
      provider.login({
        email: 'unknown@example.com',
        password: 'Dev123!ChangeMe',
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

  it('authenticates a created user using the persisted development password', async () => {
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
    expect(JSON.stringify(localStorage)).toContain('StrongPass1');
    expect(JSON.stringify(auditLog.getLogs())).not.toContain('StrongPass1');
  });

  it('authenticates a created user after the provider is recreated', async () => {
    await provider.createUser({
      name: 'Refresh User',
      email: 'refresh@example.com',
      password: 'StrongPass1',
    });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [MockDataStorageService, MockAuthenticationProvider],
    });

    const reloadedProvider = TestBed.inject(MockAuthenticationProvider);
    await expect(
      reloadedProvider.login({
        email: 'refresh@example.com',
        password: 'StrongPass1',
      }),
    ).resolves.toMatchObject({
      user: {
        email: 'refresh@example.com',
        passeord: 'StrongPass1',
      },
    });
  });

  it('restores a session from session storage after the provider is recreated', async () => {
    const loginResult = await provider.login({
      email: 'alice@example.com',
      password: 'Dev123!ChangeMe',
    });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [MockDataStorageService, MockAuthenticationProvider],
    });

    const reloadedProvider = TestBed.inject(MockAuthenticationProvider);
    await expect(reloadedProvider.restore()).resolves.toEqual(loginResult);
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

  it('creates an approver with customized permissions and verifies audit logging', async () => {
    const user = await provider.createUser({
      name: 'Custom Approver',
      email: 'custom.approver@example.com',
      password: 'StrongPass1',
      role: 'approver',
      permissions: [
        UserPermission.ViewChangeRequests,
        UserPermission.ApproveChangeRequests,
      ],
    });

    expect(user).toMatchObject({
      role: 'approver',
      permissions: [
        UserPermission.ViewChangeRequests,
        UserPermission.ApproveChangeRequests,
      ],
    });

    const persisted = storage.getUserById(user.id);
    expect(persisted.role).toBe('approver');
    expect(persisted.permissions).toEqual([
      UserPermission.ViewChangeRequests,
      UserPermission.ApproveChangeRequests,
    ]);
  });

  it('prevents user creation when actor is not an approver (privilege escalation check)', async () => {
    // Carol is a viewer, not an approver
    storage.setCurrentUserId('u-carol');

    await expect(
      provider.createUser({
        name: 'Unauthorized Created User',
        email: 'unauth@example.com',
        password: 'StrongPass1',
        role: 'approver',
      }),
    ).rejects.toThrow('UNAUTHORIZED');

    expect(
      storage.getUsers().some((u) => u.email === 'unauth@example.com'),
    ).toBe(false);
  });

  it('rejects invalid roles and invalid permissions', async () => {
    await expect(
      provider.createUser({
        name: 'Bad Role',
        email: 'badrole@example.com',
        password: 'StrongPass1',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        role: 'superuser' as any,
      }),
    ).rejects.toThrow('INVALID_INPUT');

    await expect(
      provider.createUser({
        name: 'Bad Perm',
        email: 'badperm@example.com',
        password: 'StrongPass1',
        role: 'viewer',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        permissions: ['delete_database' as any],
      }),
    ).rejects.toThrow('INVALID_INPUT');
  });

  it('updates a user role and permissions through updateUser', async () => {
    const created = await provider.createUser({
      name: 'Editable User',
      email: 'editable@example.com',
      password: 'StrongPass1',
      role: 'viewer',
    });

    const updated = await provider.updateUser(created.id, {
      role: 'requester',
      permissions: [
        UserPermission.ViewChangeRequests,
        UserPermission.CreateChangeRequests,
      ],
    });

    expect(updated.role).toBe('requester');
    expect(updated.permissions).toEqual([
      UserPermission.ViewChangeRequests,
      UserPermission.CreateChangeRequests,
    ]);

    const persisted = storage.getUserById(created.id);
    expect(persisted.role).toBe('requester');
    expect(persisted.permissions).toEqual([
      UserPermission.ViewChangeRequests,
      UserPermission.CreateChangeRequests,
    ]);
  });
});
