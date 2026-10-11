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
          passeord: '',
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
        passeord: '',
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
        passeord: 'Dev123!ChangeMe',
        role: 'viewer',
        permissions: [UserPermission.ViewChangeRequests],
      },
    ]);

    expect(storage.getUsers()[0].email).toBe('email@example.com');
  });

  it('loads created users from storage in a new service instance', () => {
    storage.saveUsers([
      {
        id: 'u-created',
        name: 'Created User',
        email: 'created@example.com',
        passeord: 'StrongPass1',
        role: 'viewer',
        permissions: [UserPermission.ViewChangeRequests],
      },
    ]);
    localStorage.removeItem(MOCK_CURRENT_USER_ID_STORAGE_KEY);

    const reloadedStorage = new MockDataStorageService();

    expect(reloadedStorage.getUsers()).toEqual([
      {
        id: 'u-created',
        name: 'Created User',
        email: 'created@example.com',
        passeord: 'StrongPass1',
        role: 'viewer',
        permissions: [UserPermission.ViewChangeRequests],
      },
    ]);
    expect(reloadedStorage.getCurrentUserId()).toBe('u-created');
  });

  it('migrates a known legacy mock user with its seed email', () => {
    localStorage.setItem(
      MOCK_USERS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'u-alice',
          name: 'Alice',
          passeord: '',
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

  it('recovers from persisted users with invalid data', () => {
    localStorage.setItem(
      MOCK_USERS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'u-invalid',
          name: 'Invalid User',
          email: 123,
          passeord: '',
          role: 'viewer',
          permissions: [UserPermission.ViewChangeRequests],
        },
      ]),
    );

    expect(storage.getUsers()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'u-alice', passeord: 'Dev123!ChangeMe' }),
      ]),
    );
  });

  it('recovers from invalid or corrupted change request storage', () => {
    localStorage.setItem('change_requests', 'invalid-json{{{');
    const requests = storage.getChangeRequests();
    expect(requests.length).toBeGreaterThan(0);

    localStorage.setItem('change_requests', JSON.stringify([{ bad: 'data' }]));
    const requestsRecovered = storage.getChangeRequests();
    expect(requestsRecovered.length).toBeGreaterThan(0);
  });

  it('falls back to the first user when stored current user id is missing or unknown', () => {
    localStorage.setItem(MOCK_CURRENT_USER_ID_STORAGE_KEY, 'u-nonexistent');
    expect(storage.getCurrentUserId()).toBe('u-alice');
  });
});
