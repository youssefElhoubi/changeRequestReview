import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthenticationProvider } from './authentication-provider';
import { UserManagementService } from './user-management.service';
import {
  CreateUserInput,
  User,
  UserPermission,
} from '../../features/change-requests/models/change-request.models';

describe('UserManagementService', () => {
  let service: UserManagementService;
  let provider: { createUser: jest.Mock; updateUser?: jest.Mock };
  const validInput: CreateUserInput = {
    name: 'New User',
    email: 'new@example.com',
    password: 'StrongPass1',
  };

  beforeEach(() => {
    provider = {
      createUser: jest.fn(() =>
        Promise.resolve({
          id: 'u-new',
          name: 'New User',
          email: 'new@example.com',
          role: 'viewer',
          passeord: 'StrongPass1',
          permissions: [UserPermission.ViewChangeRequests],
        } as User),
      ),
    };
    TestBed.configureTestingModule({
      providers: [
        UserManagementService,
        { provide: AuthenticationProvider, useValue: provider },
      ],
    });
    service = TestBed.inject(UserManagementService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates a valid user and exposes a success state', async () => {
    const created = await firstValueFrom(service.createUser(validInput));

    expect(created).toMatchObject({
      id: 'u-new',
      role: 'viewer',
      passeord: 'StrongPass1',
      permissions: [UserPermission.ViewChangeRequests],
    });
    expect(provider.createUser).toHaveBeenCalledWith(validInput);
    expect(await firstValueFrom(service.creationState$)).toMatchObject({
      status: 'success',
      user: created,
    });
  });

  it('rejects invalid input without calling the provider', async () => {
    await expect(
      firstValueFrom(service.createUser({ ...validInput, password: 'weak' })),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

    expect(provider.createUser).not.toHaveBeenCalled();
  });

  it('rejects an empty password without calling the provider', async () => {
    await expect(
      firstValueFrom(service.createUser({ ...validInput, password: '' })),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

    expect(provider.createUser).not.toHaveBeenCalled();
  });

  it('prevents duplicate submissions while a request is in progress', async () => {
    let resolveCreation: (user: User) => void = () => undefined;
    provider.createUser.mockReturnValue(
      new Promise<User>((resolve) => {
        resolveCreation = resolve;
      }),
    );

    const first = service.createUser(validInput);
    await expect(
      firstValueFrom(service.createUser(validInput)),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

    resolveCreation({
      id: 'u-new',
      name: 'New User',
      email: validInput.email,
      passeord: 'StrongPass1',
      role: 'viewer',
      permissions: [UserPermission.ViewChangeRequests],
    });
    await firstValueFrom(first);
    expect(provider.createUser).toHaveBeenCalledTimes(1);
  });

  it('passes configured role and permissions to the provider', async () => {
    const inputWithRole: CreateUserInput = {
      ...validInput,
      role: 'approver',
      permissions: [
        UserPermission.ViewChangeRequests,
        UserPermission.ApproveChangeRequests,
      ],
    };

    await firstValueFrom(service.createUser(inputWithRole));
    expect(provider.createUser).toHaveBeenCalledWith(inputWithRole);
  });

  it('exposes an UNAUTHORIZED error state when provider rejects unauthorized creation', async () => {
    provider.createUser.mockRejectedValue(new Error('UNAUTHORIZED'));

    await expect(
      firstValueFrom(service.createUser(validInput)),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });

    expect(await firstValueFrom(service.creationState$)).toMatchObject({
      status: 'error',
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('calls updateUser on the provider when available', async () => {
    const updateUserMock = jest.fn().mockResolvedValue({
      id: 'u-edit',
      role: 'requester',
      permissions: [
        UserPermission.ViewChangeRequests,
        UserPermission.CreateChangeRequests,
      ],
    });
    provider.updateUser = updateUserMock;

    const result = await firstValueFrom(
      service.updateUser('u-edit', {
        role: 'requester',
        permissions: [
          UserPermission.ViewChangeRequests,
          UserPermission.CreateChangeRequests,
        ],
      }),
    );

    expect(result.role).toBe('requester');
    expect(updateUserMock).toHaveBeenCalledWith('u-edit', {
      role: 'requester',
      permissions: [
        UserPermission.ViewChangeRequests,
        UserPermission.CreateChangeRequests,
      ],
    });
  });
});
