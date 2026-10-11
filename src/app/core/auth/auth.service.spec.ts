import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { AuthenticationProvider } from './authentication-provider';
import { MockDataStorageService } from '../api/mock-data-storage.service';
import {
  AuthenticationResult,
  User,
} from '../../features/change-requests/models/change-request.models';

describe('AuthService', () => {
  let service: AuthService;
  let provider: {
    login: jest.Mock;
    restore: jest.Mock;
    logout: jest.Mock;
  };
  const alice: User = {
    id: 'u-alice',
    name: 'Alice',
    email: 'alice@example.com',
    role: 'approver',
    permissions: [],
  };
  const aliceEmail = 'alice@example.com';

  beforeEach(() => {
    sessionStorage.clear();
    provider = {
      login: jest.fn(),
      restore: jest.fn(() => Promise.resolve(null)),
      logout: jest.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        MockDataStorageService,
        { provide: AuthenticationProvider, useValue: provider },
      ],
    });
  });

  afterEach(() => {
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  it('publishes the authenticated user after a successful login', async () => {
    const result: AuthenticationResult = {
      user: alice,
      sessionToken: 'session-token',
    };
    provider.login.mockResolvedValue(result);
    service = TestBed.inject(AuthService);

    await firstValueFrom(
      service.login({ email: aliceEmail, password: 'secret' }),
    );

    expect(await firstValueFrom(service.state$)).toEqual({
      status: 'authenticated',
      user: alice,
      error: null,
    });
  });

  it('publishes an invalid-credentials error when login fails', async () => {
    provider.login.mockRejectedValue(new Error('INVALID_CREDENTIALS'));
    service = TestBed.inject(AuthService);

    await expect(
      firstValueFrom(
        service.login({ email: aliceEmail, password: 'wrong-password' }),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect((await firstValueFrom(service.state$)).status).toBe('error');
  });

  it('clears the authenticated state on logout', async () => {
    provider.login.mockResolvedValue({
      user: alice,
      sessionToken: 'session-token',
    });
    service = TestBed.inject(AuthService);
    await firstValueFrom(
      service.login({ email: aliceEmail, password: 'secret' }),
    );

    service.logout();

    expect(provider.logout).toHaveBeenCalled();
    expect(await firstValueFrom(service.state$)).toEqual({
      status: 'unauthenticated',
      user: null,
      error: null,
    });
  });

  it('restores an existing session during construction', async () => {
    provider.restore.mockResolvedValue({
      user: alice,
      sessionToken: 'session-token',
    });

    const restored = TestBed.inject(AuthService);
    await new Promise((resolve) => setTimeout(resolve));

    expect(provider.restore).toHaveBeenCalled();
    expect(await firstValueFrom(restored.state$)).toMatchObject({
      status: 'authenticated',
      user: alice,
    });
  });
});
