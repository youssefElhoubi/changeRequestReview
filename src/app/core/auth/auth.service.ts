import { Injectable } from '@angular/core';

import {
  User,
  UserPermission,
  UserRole,
} from '../../features/change-requests/models/change-request.models';
import { MockDataStorageService } from '../api/mock-data-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private readonly storage: MockDataStorageService) {}

  get currentUser(): User {
    return this.storage.getUserById(this.currentUserIdValue);
  }

  get currentUserIdValue(): string {
    return this.storage.getCurrentUserId();
  }

  hasPermission(permission: UserPermission): boolean {
    return this.currentUser.permissions.includes(permission);
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser.role === role;
  }

  setCurrentUser(userId: string): void {
    this.storage.setCurrentUserId(userId);
  }

  getUsers(): User[] {
    return this.storage.getUsers();
  }
}
