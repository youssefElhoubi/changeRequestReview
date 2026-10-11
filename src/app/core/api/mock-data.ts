import {
  ChangeRequest,
  ChangeRequestStatus,
  User,
  UserPermission,
} from '../../features/change-requests/models/change-request.models';

// Development-only credentials persisted in the mock user records. Never use
// this plaintext browser-side approach in production.
const DEVELOPMENT_PASSWORD = 'Dev123!ChangeMe';

export const MOCK_USERS: User[] = [
  {
    id: 'u-alice',
    name: 'Alice',
    email: 'alice@example.com',
    passeord: DEVELOPMENT_PASSWORD,
    role: 'approver',
    permissions: [
      UserPermission.ViewChangeRequests,
      UserPermission.ApproveChangeRequests,
      UserPermission.RejectChangeRequests,
    ],
  },
  {
    id: 'u-bob',
    name: 'Bob',
    email: 'bob@example.com',
    passeord: DEVELOPMENT_PASSWORD,
    role: 'approver',
    permissions: [
      UserPermission.ViewChangeRequests,
      UserPermission.ApproveChangeRequests,
      UserPermission.RejectChangeRequests,
    ],
  },
  {
    id: 'u-carol',
    name: 'Carol',
    email: 'carol@example.com',
    passeord: DEVELOPMENT_PASSWORD,
    role: 'viewer',
    permissions: [UserPermission.ViewChangeRequests],
  },
  {
    id: 'u-dave',
    name: 'Dave',
    email: 'dave@example.com',
    passeord: DEVELOPMENT_PASSWORD,
    role: 'requester',
    permissions: [
      UserPermission.ViewChangeRequests,
      UserPermission.CreateChangeRequests,
    ],
  },
];

export const MOCK_CHANGE_REQUESTS: ChangeRequest[] = [
  {
    id: 'cr-1001',
    title: 'Update marketing budget',
    status: ChangeRequestStatus.PendingReview,
    createdBy: { id: 'u-bob', name: 'Bob' },
    createdAt: '2026-01-10T09:00:00.000Z',
    changeCount: 2,
    description: 'Adjust the marketing budget for the next quarter.',
    changes: [
      {
        id: 'marketing-budget',
        field: 'Marketing budget',
        before: 10000,
        after: 12500,
      },
      { id: 'campaigns', field: 'Active campaigns', before: 4, after: 6 },
    ],
    timeline: [
      {
        id: 'event-1001-1',
        type: 'created',
        actor: { id: 'u-bob', name: 'Bob' },
        at: '2026-01-10T09:00:00.000Z',
      },
      {
        id: 'event-1001-2',
        type: 'submitted',
        actor: { id: 'u-bob', name: 'Bob' },
        at: '2026-01-10T10:00:00.000Z',
      },
    ],
  },
  {
    id: 'cr-1002',
    title: 'Add customer success team',
    status: ChangeRequestStatus.PendingReview,
    createdBy: { id: 'u-alice', name: 'Alice' },
    createdAt: '2026-01-11T09:00:00.000Z',
    changeCount: 1,
    description: 'Create a new customer success team.',
    changes: [
      {
        id: 'customer-success',
        field: 'Customer success team',
        before: null,
        after: 1,
      },
    ],
    timeline: [
      {
        id: 'event-1002-1',
        type: 'submitted',
        actor: { id: 'u-alice', name: 'Alice' },
        at: '2026-01-11T09:30:00.000Z',
      },
    ],
  },
  {
    id: 'cr-1003',
    title: 'Revise service limits',
    status: ChangeRequestStatus.PendingReview,
    createdBy: { id: 'u-bob', name: 'Bob' },
    createdAt: '2026-01-12T09:00:00.000Z',
    changeCount: 4,
    description: 'Update service limits with all supported diff types.',
    changes: [
      { id: 'new-limit', field: 'New limit', before: null, after: 100 },
      { id: 'removed-limit', field: 'Removed limit', before: 50, after: null },
      { id: 'changed-limit', field: 'Changed limit', before: 10, after: 20 },
      { id: 'unchanged-zero', field: 'Zero limit', before: 0, after: 0 },
    ],
    timeline: [
      {
        id: 'event-1003-2',
        type: 'submitted',
        actor: { id: 'u-bob', name: 'Bob' },
        at: '2026-01-12T11:00:00.000Z',
      },
      {
        id: 'event-1003-1',
        type: 'created',
        actor: { id: 'u-bob', name: 'Bob' },
        at: '2026-01-12T09:00:00.000Z',
      },
    ],
  },
  {
    id: 'cr-1004',
    title: 'Draft pricing experiment',
    status: ChangeRequestStatus.Draft,
    createdBy: { id: 'u-alice', name: 'Alice' },
    createdAt: '2026-01-13T09:00:00.000Z',
    changeCount: 1,
    description: 'Prepare a pricing experiment for review.',
    changes: [{ id: 'discount', field: 'Discount', before: 5, after: 10 }],
    timeline: [
      {
        id: 'event-1004-1',
        type: 'created',
        actor: { id: 'u-alice', name: 'Alice' },
        at: '2026-01-13T09:00:00.000Z',
      },
    ],
  },
  {
    id: 'cr-1005',
    title: 'Approved retention policy',
    status: ChangeRequestStatus.Approved,
    createdBy: { id: 'u-bob', name: 'Bob' },
    createdAt: '2026-01-14T09:00:00.000Z',
    changeCount: 1,
    description: 'Extend the retention policy.',
    changes: [
      { id: 'retention', field: 'Retention days', before: 30, after: 90 },
    ],
    timeline: [
      {
        id: 'event-1005-1',
        type: 'approved',
        actor: { id: 'u-alice', name: 'Alice' },
        at: '2026-01-14T11:00:00.000Z',
      },
    ],
  },
  {
    id: 'cr-1006',
    title: 'Rejected vendor access',
    status: ChangeRequestStatus.Rejected,
    createdBy: { id: 'u-bob', name: 'Bob' },
    createdAt: '2026-01-15T09:00:00.000Z',
    changeCount: 1,
    description: 'Request vendor access to reporting data.',
    changes: [
      { id: 'vendor-access', field: 'Vendor access', before: 0, after: 1 },
    ],
    timeline: [
      {
        id: 'event-1006-1',
        type: 'rejected',
        actor: { id: 'u-alice', name: 'Alice' },
        at: '2026-01-15T11:00:00.000Z',
        note: 'Access is not required.',
      },
    ],
  },
  {
    id: 'cr-slow',
    title: 'Slow compliance review',
    status: ChangeRequestStatus.PendingReview,
    createdBy: { id: 'u-bob', name: 'Bob' },
    createdAt: '2026-01-16T09:00:00.000Z',
    changeCount: 1,
    description: 'A fixture for slow network states.',
    changes: [
      { id: 'compliance', field: 'Compliance level', before: 1, after: 2 },
    ],
    timeline: [
      {
        id: 'event-slow-1',
        type: 'submitted',
        actor: { id: 'u-bob', name: 'Bob' },
        at: '2026-01-16T09:00:00.000Z',
      },
    ],
  },
  {
    id: 'cr-fail',
    title: 'Failing integration review',
    status: ChangeRequestStatus.PendingReview,
    createdBy: { id: 'u-bob', name: 'Bob' },
    createdAt: '2026-01-17T09:00:00.000Z',
    changeCount: 1,
    description: 'A fixture for failed approve and reject actions.',
    changes: [
      { id: 'integration', field: 'Integration level', before: 1, after: 2 },
    ],
    timeline: [
      {
        id: 'event-fail-1',
        type: 'submitted',
        actor: { id: 'u-bob', name: 'Bob' },
        at: '2026-01-17T09:00:00.000Z',
      },
    ],
  },
];
