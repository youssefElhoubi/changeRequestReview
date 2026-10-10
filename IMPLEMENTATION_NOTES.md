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
