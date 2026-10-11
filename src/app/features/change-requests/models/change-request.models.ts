export enum ChangeRequestStatus {
  Draft = 'draft',
  PendingReview = 'pending_review',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum UserPermission {
  ViewChangeRequests = 'view_change_requests',
  ApproveChangeRequests = 'approve_change_requests',
  RejectChangeRequests = 'reject_change_requests',
}

export type UserRole = 'approver' | 'viewer';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  permissions: UserPermission[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export type UserCreationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UserCreationError {
  code: 'INVALID_INPUT' | 'DUPLICATE_EMAIL' | 'UNKNOWN';
  message: string;
}

export interface UserCreationState {
  status: UserCreationStatus;
  user: User | null;
  error: UserCreationError | null;
}

export type AuditOutcome = 'success' | 'failure';

export interface AuditLog {
  id: string;
  actorUserId: string;
  action: 'user.created' | 'user.create_failed';
  targetUserId: string;
  timestamp: string;
  description: string;
  outcome: AuditOutcome;
  changedFields?: readonly string[];
}

export interface AuthenticationResult {
  user: User;
  sessionToken: string;
  expiresAt?: string;
}

export type AuthenticationStatus =
  'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthenticationError {
  code: 'INVALID_CREDENTIALS' | 'SESSION_NOT_FOUND' | 'UNKNOWN';
  message: string;
}

export const DEFAULT_NEW_USER_ROLE: UserRole = 'viewer';
export const DEFAULT_NEW_USER_PERMISSIONS: readonly UserPermission[] = [
  UserPermission.ViewChangeRequests,
];

export interface ChangeRequestSummary {
  id: string;
  title: string;
  status: ChangeRequestStatus;
  createdBy: Pick<User, 'id' | 'name'>;
  createdAt: string;
  changeCount: number;
}

export interface ChangeEntry {
  id: string;
  field: string;
  before: string | number | boolean | null;
  after: string | number | boolean | null;
}

export type TimelineEventType =
  'created' | 'submitted' | 'approved' | 'rejected' | 'commented';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  actor: Pick<User, 'id' | 'name'>;
  at: string;
  note?: string;
}

export interface ChangeRequest extends ChangeRequestSummary {
  description: string;
  changes: ChangeEntry[];
  timeline: TimelineEvent[];
}

export interface RejectChangeRequestBody {
  reason: string;
}
