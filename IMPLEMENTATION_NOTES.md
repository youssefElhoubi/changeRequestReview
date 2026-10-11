# Implementation Notes

## Architecture

The application uses Angular 15 NgModules and a lazy-loaded change-request feature. Smart containers are responsible for routing, API calls, authentication state, and view-model observables. `CrListComponent` owns list loading, explicit `visibleRows` state management to prevent data mutation, and filter selection. `CrDetailComponent` owns detail loading and action submission. Dumb components (`CrTableComponent`, `CrDiffTableComponent`, `CrTimelineComponent`, and `CrActionsComponent`) receive inputs and emit user intent through outputs. The HTTP service is the API boundary and the interceptor supplies the in-memory mock backend.

## Explicit view states

The list renders `loading` (via a Tailwind animated spinner), `loaded`, `empty`, and `error` states. A loaded response is also checked after filtering so a valid request with no matching status renders a separate “No matching change requests” state. The detail view renders loading, error, and loaded content; action submission retains the current request on screen and disables both action controls while the request is in flight. Action errors are rendered without replacing the current request.

## Testing strategy

Jest DOM tests use Angular `TestBed` and mock `ChangeRequestService` at the HTTP boundary. List tests assert visible loading, empty, error, filtered-row, and no-match output. Detail tests assert that the real templates render diff rows (including calculated totals, overall delta, and classification badges) and child content, and that authorization, creator-policy, and status gates disable actions. Focused child-component tests verify diff values, chronological timeline rendering without mutating inputs, and rejection validation/output. Fixtures are local to each test so mutable component and mock state cannot leak between cases.

## AI usage

AI (GitHub Copilot) was utilized during the development phases to:

- Scaffold boilerplate Angular component structures and interfaces.
- Generate the initial DOM-querying boilerplate for the Jest test suites in Phase 5 (`cr-list.component.spec.ts`, `cr-detail.component.spec.ts`, and child components).
- Expedite the final audit fixes, specifically computing aggregate diff totals, rendering classification badges (Added/Changed/Removed), and implementing the animated Tailwind loading states.
  All generated code was manually reviewed, audited, and adjusted to meet the strict architectural and behavioral requirements.

## Trade-offs

The current codebase exposes permission decisions as booleans on the detail view model, so tests verify their rendered effect rather than coupling to private implementation details. The tests use small hand-written fixtures instead of the mutable mock seed data, which keeps each DOM assertion focused and deterministic.

## Authentication and user creation

Authentication is isolated behind `AuthenticationProvider`; the current provider is explicitly mock-only. New users receive the existing least-privileged `viewer` role and `ViewChangeRequests` permission. The transient `CreateUserInput.password` and `LoginCredentials.password` values are not written to audit records or displayed in user lists. This browser-side mock is not production-secure: a real backend must own credential verification, password hashing, sessions, and authorization before this is used beyond development.

The requested `User` contract now includes the deliberately misspelled required `passeord` field. Seeded and newly created mock users persist this plaintext development-only credential in the same localStorage-backed user records so authentication and profile persistence have one source of truth. This is intentionally not production-secure: the password must never be used outside local development, and a real backend must own credential verification, password hashing, sessions, and authorization.

## Audit logging

The only existing user-record mutation is `MockAuthenticationProvider.createUser`; `MockDataStorageService.saveUsers` remains a persistence primitive and is intentionally not audited to avoid duplicate entries during initialization and reset. Successful creation and duplicate-email failures are recorded by `AuditLogService`, including the existing mock actor ID, target ID/email, timestamp, outcome, description, and non-sensitive changed-field names. If audit persistence fails after a user write, creation rolls back the user record and in-memory credential digest. There are currently no user update or delete methods, so those operations remain unaudited. Mock audit logs live in browser storage and are mutable by the user; trusted, tamper-resistant audit history and identity verification require a backend.

## Route guards

`AuthGuard` waits for the reactive authentication state to leave `loading`, redirects unauthenticated navigation to the public login route with a `returnUrl`, and redirects authenticated users without the route's existing role or permission requirement to `/forbidden`. These are client-side navigation controls only; the mock guard is not a security boundary. A real backend must independently verify sessions and enforce authorization on every protected operation.
