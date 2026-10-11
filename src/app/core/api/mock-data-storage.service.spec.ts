import {
  MOCK_CURRENT_USER_ID_STORAGE_KEY,
  MOCK_USERS_STORAGE_KEY,
  MockDataStorageService,
} from './mock-data-storage.service';
import { UserPermission } from '../../features/change-requests/models/change-request.models';

describe('MockDataStorageService user compatibility', () => {
  let storage: MockDataStorageService;

  beforeEach(() => {
    localStorage.clear();
    storage = new MockDataStorageService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('accepts legacy users that do not have an email', () => {
    localStorage.setItem(
      MOCK_USERS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'u-legacy',
          name: 'Legacy User',
          role: 'viewer',
          permissions: [UserPermission.ViewChangeRequests],
        },
      ]),
    );
    localStorage.setItem(MOCK_CURRENT_USER_ID_STORAGE_KEY, 'u-legacy');

    expect(storage.getUsers()).toEqual([
      {
        id: 'u-legacy',
        name: 'Legacy User',
        role: 'viewer',
        permissions: [UserPermission.ViewChangeRequests],
      },
    ]);
    expect(storage.getCurrentUserId()).toBe('u-legacy');
  });

  it('preserves an optional email when reading users', () => {
    storage.saveUsers([
      {
        id: 'u-email',
        name: 'Email User',
        email: 'email@example.com',
        role: 'viewer',
        permissions: [UserPermission.ViewChangeRequests],
      },
    ]);

    expect(storage.getUsers()[0].email).toBe('email@example.com');
  });

  it('migrates a known legacy mock user with its seed email', () => {
    localStorage.setItem(
      MOCK_USERS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'u-alice',
          name: 'Alice',
          role: 'approver',
          permissions: [
            'view_change_requests',
            'approve_change_requests',
            'reject_change_requests',
          ],
        },
      ]),
    );

    expect(storage.getUsers()[0].email).toBe('alice@example.com');
  });

  it('rejects persisted users with an invalid email value', () => {
    localStorage.setItem(
      MOCK_USERS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'u-invalid',
          name: 'Invalid User',
          email: 123,
          role: 'viewer',
          permissions: [UserPermission.ViewChangeRequests],
        },
      ]),
    );

    expect(() => storage.getUsers()).toThrow(
      'Mock user storage contains invalid data.',
    );
  });
});
