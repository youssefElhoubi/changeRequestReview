export enum ChangeRequestStatus {
  Draft = 'draft',
  PendingReview = 'pending_review',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum UserPermission {
  ViewChangeRequests = 'view_change_requests',
  CreateChangeRequests = 'create_change_requests',
  ApproveChangeRequests = 'approve_change_requests',
  RejectChangeRequests = 'reject_change_requests',
}

export type UserRole = 'approver' | 'viewer' | 'requester';

export interface User {
  id: string;
  name: string;
  email?: string;
  passeord: string;
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
  role?: UserRole;
  permissions?: UserPermission[];
}

export type UserCreationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UserCreationError {
  code: 'INVALID_INPUT' | 'DUPLICATE_EMAIL' | 'UNAUTHORIZED' | 'UNKNOWN';
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
  action: 'user.created' | 'user.create_failed' | 'user.updated';
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

export interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
}

export const ALL_USER_ROLES: readonly UserRole[] = [
  'viewer',
  'requester',
  'approver',
];

export const ROLE_OPTIONS: readonly RoleOption[] = [
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Can view change requests',
  },
  {
    value: 'requester',
    label: 'Requester',
    description: 'Can view and create change requests',
  },
  {
    value: 'approver',
    label: 'Approver',
    description: 'Can view, approve, and reject change requests',
  },
];

export interface PermissionOption {
  value: UserPermission;
  label: string;
  description: string;
}

export const ALL_USER_PERMISSIONS: readonly UserPermission[] = [
  UserPermission.ViewChangeRequests,
  UserPermission.CreateChangeRequests,
  UserPermission.ApproveChangeRequests,
  UserPermission.RejectChangeRequests,
];

export const PERMISSION_OPTIONS: readonly PermissionOption[] = [
  {
    value: UserPermission.ViewChangeRequests,
    label: 'View change requests',
    description: 'View all change requests and their histories',
  },
  {
    value: UserPermission.CreateChangeRequests,
    label: 'Create change requests',
    description: 'Propose and submit new change requests',
  },
  {
    value: UserPermission.ApproveChangeRequests,
    label: 'Approve change requests',
    description: 'Approve pending change requests',
  },
  {
    value: UserPermission.RejectChangeRequests,
    label: 'Reject change requests',
    description: 'Reject pending change requests with a reason',
  },
];

export const ROLE_DEFAULT_PERMISSIONS: Record<
  UserRole,
  readonly UserPermission[]
> = {
  viewer: [UserPermission.ViewChangeRequests],
  requester: [
    UserPermission.ViewChangeRequests,
    UserPermission.CreateChangeRequests,
  ],
  approver: [
    UserPermission.ViewChangeRequests,
    UserPermission.ApproveChangeRequests,
    UserPermission.RejectChangeRequests,
  ],
};

export const DEFAULT_NEW_USER_ROLE: UserRole = 'viewer';
export const DEFAULT_NEW_USER_PERMISSIONS: readonly UserPermission[] =
  ROLE_DEFAULT_PERMISSIONS.viewer;

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

export interface CreateChangeRequestBody {
  title: string;
  description: string;
  changes: Omit<ChangeEntry, 'id'>[];
}
