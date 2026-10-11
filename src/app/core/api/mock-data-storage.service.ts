import { Injectable } from '@angular/core';

import {
  ChangeRequest,
  ChangeRequestStatus,
  ChangeEntry,
  TimelineEvent,
  TimelineEventType,
  User,
  UserPermission,
  UserRole,
} from '../../features/change-requests/models/change-request.models';
import { MOCK_CHANGE_REQUESTS, MOCK_USERS } from './mock-data';

export const MOCK_CHANGE_REQUESTS_STORAGE_KEY =
  'change-request-review.mock-change-requests';
export const MOCK_USERS_STORAGE_KEY = 'change-request-review.mock-users';
export const MOCK_CURRENT_USER_ID_STORAGE_KEY =
  'change-request-review.mock-current-user-id';

@Injectable({
  providedIn: 'root',
})
export class MockDataStorageService {
  initialize(): void {
    if (localStorage.getItem(MOCK_CHANGE_REQUESTS_STORAGE_KEY) === null) {
      this.saveChangeRequests(MOCK_CHANGE_REQUESTS);
    }
    if (localStorage.getItem(MOCK_USERS_STORAGE_KEY) === null) {
      this.saveUsers(MOCK_USERS);
    } else {
      this.migrateUsers();
    }
    if (localStorage.getItem(MOCK_CURRENT_USER_ID_STORAGE_KEY) === null) {
      const rawUsers = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
      let initialUserId = MOCK_USERS[0].id;
      if (rawUsers !== null) {
        try {
          const parsed: unknown = JSON.parse(rawUsers);
          if (
            Array.isArray(parsed) &&
            parsed.length > 0 &&
            isRecord(parsed[0]) &&
            typeof parsed[0]['id'] === 'string'
          ) {
            initialUserId = parsed[0]['id'];
          }
        } catch {
          initialUserId = MOCK_USERS[0].id;
        }
      }
      localStorage.setItem(MOCK_CURRENT_USER_ID_STORAGE_KEY, initialUserId);
    }
  }

  getChangeRequests(): ChangeRequest[] {
    this.initialize();

    const raw = localStorage.getItem(MOCK_CHANGE_REQUESTS_STORAGE_KEY);
    if (raw === null) {
      throw new Error('Mock change request storage was not initialized.');
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isChangeRequest)) {
      throw new Error('Mock change request storage contains invalid data.');
    }

    return parsed.map((request) => this.clone(request));
  }

  saveChangeRequests(requests: ChangeRequest[]): void {
    localStorage.setItem(
      MOCK_CHANGE_REQUESTS_STORAGE_KEY,
      JSON.stringify(requests.map((request) => this.clone(request))),
    );
  }

  reset(): void {
    this.saveChangeRequests(MOCK_CHANGE_REQUESTS);
    this.saveUsers(MOCK_USERS);
    localStorage.setItem(MOCK_CURRENT_USER_ID_STORAGE_KEY, MOCK_USERS[0].id);
  }

  getUsers(): User[] {
    this.initialize();

    const raw = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
    if (raw === null) {
      throw new Error('Mock user storage was not initialized.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.saveUsers(MOCK_USERS);
      return MOCK_USERS.map((user) => this.clone(user));
    }

    if (!Array.isArray(parsed) || !parsed.every(isUser)) {
      this.saveUsers(MOCK_USERS);
      return MOCK_USERS.map((user) => this.clone(user));
    }

    return parsed.map((user) => this.clone(user));
  }

  saveUsers(users: User[]): void {
    localStorage.setItem(
      MOCK_USERS_STORAGE_KEY,
      JSON.stringify(users.map((user) => this.clone(user))),
    );
  }

  getCurrentUserId(): string {
    this.initialize();

    const userId = localStorage.getItem(MOCK_CURRENT_USER_ID_STORAGE_KEY);
    if (
      userId === null ||
      this.getUsers().every((user) => user.id !== userId)
    ) {
      throw new Error(`Unknown current user: ${userId ?? '(missing)'}`);
    }

    return userId;
  }

  setCurrentUserId(userId: string): void {
    if (this.getUsers().every((user) => user.id !== userId)) {
      throw new Error(`Unknown current user: ${userId}`);
    }

    localStorage.setItem(MOCK_CURRENT_USER_ID_STORAGE_KEY, userId);
  }

  getUserById(userId: string): User {
    const user = this.getUsers().find((candidate) => candidate.id === userId);
    if (!user) {
      throw new Error(`Unknown user: ${userId}`);
    }

    return user;
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  private migrateUsers(): void {
    const raw = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
    if (raw === null) {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.saveUsers(MOCK_USERS);
      return;
    }
    if (!Array.isArray(parsed)) {
      this.saveUsers(MOCK_USERS);
      return;
    }

    const migrated = parsed.map((value) => {
      if (!isRecord(value) || typeof value['id'] !== 'string') {
        return value;
      }
      const seed = MOCK_USERS.find((user) => user.id === value['id']);
      return {
        ...value,
        email:
          value['email'] === undefined && seed ? seed.email : value['email'],
        passeord:
          value['passeord'] === undefined
            ? (seed?.passeord ?? '')
            : value['passeord'],
      };
    });

    if (JSON.stringify(migrated) !== raw) {
      localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(migrated));
    }
  }
}

function isChangeRequest(value: unknown): value is ChangeRequest {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['id'] === 'string' &&
    typeof value['title'] === 'string' &&
    isChangeRequestStatus(value['status']) &&
    isUserSummary(value['createdBy']) &&
    typeof value['createdAt'] === 'string' &&
    typeof value['changeCount'] === 'number' &&
    typeof value['description'] === 'string' &&
    Array.isArray(value['changes']) &&
    value['changes'].every(isChangeEntry) &&
    Array.isArray(value['timeline']) &&
    value['timeline'].every(isTimelineEvent)
  );
}

function isUser(value: unknown): value is User {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string' &&
    (value['email'] === undefined || typeof value['email'] === 'string') &&
    typeof value['passeord'] === 'string' &&
    isUserRole(value['role']) &&
    Array.isArray(value['permissions']) &&
    value['permissions'].every(isUserPermission)
  );
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'approver' || value === 'viewer' || value === 'requester';
}

function isUserPermission(value: unknown): value is UserPermission {
  return (
    value === UserPermission.ViewChangeRequests ||
    value === UserPermission.CreateChangeRequests ||
    value === UserPermission.ApproveChangeRequests ||
    value === UserPermission.RejectChangeRequests
  );
}

function isChangeRequestStatus(value: unknown): value is ChangeRequestStatus {
  return (
    value === ChangeRequestStatus.Draft ||
    value === ChangeRequestStatus.PendingReview ||
    value === ChangeRequestStatus.Approved ||
    value === ChangeRequestStatus.Rejected
  );
}

function isUserSummary(value: unknown): value is Pick<User, 'id' | 'name'> {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string'
  );
}

function isChangeEntry(value: unknown): value is ChangeEntry {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['field'] === 'string' &&
    isChangeValue(value['before']) &&
    isChangeValue(value['after'])
  );
}

function isChangeValue(
  value: unknown,
): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function isTimelineEvent(value: unknown): value is TimelineEvent {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    isTimelineEventType(value['type']) &&
    isUserSummary(value['actor']) &&
    typeof value['at'] === 'string' &&
    (value['note'] === undefined || typeof value['note'] === 'string')
  );
}

function isTimelineEventType(value: unknown): value is TimelineEventType {
  return (
    value === 'created' ||
    value === 'submitted' ||
    value === 'approved' ||
    value === 'rejected' ||
    value === 'commented'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
