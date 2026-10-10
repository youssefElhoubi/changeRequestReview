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
  role: UserRole;
  permissions: UserPermission[];
}

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
