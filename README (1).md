# Change Request Review UI

An Angular 15 reviewer experience for **Change Requests (CRs)**. An approver can
find a CR, understand the proposed changes and history, and **approve or
reject** it, with permissions, loading, empty, slow, and failing states handled
explicitly.

This repository is the **Penny Frontend Engineering Take-Home**. The detailed
requirements are in [`CANDIDATE_BRIEF.md`](./CANDIDATE_BRIEF.md), which is the
source of truth.

> This README was written from the assessment summary. Sections marked
> **[CONFIRM]** need to be checked against the real repository.

---

## Tech Stack

| Area      | Tooling                                                |
| --------- | ------------------------------------------------------ |
| Framework | Angular 15                                             |
| Language  | TypeScript (strict)                                    |
| Styling   | Tailwind CSS v3                                        |
| State     | RxJS stores in injectable services (`BehaviorSubject`) |
| Testing   | Jest + `jest-preset-angular` (component/DOM tests)     |
| Quality   | ESLint, Prettier                                       |

---

## Getting Started

### Prerequisites

- Node.js compatible with Angular 15 (14.20+, 16.13+, or 18.10+)
- npm

### Install and run

```bash
npm ci          # clean, reproducible install
npm start       # dev server, http://localhost:4200
```

### Scripts

| Command              | Purpose                     |
| -------------------- | --------------------------- |
| `npm start`          | Run the dev server          |
| `npm test`           | Run the Jest test suite     |
| `npm run test:watch` | Jest in watch mode          |
| `npm run build`      | Production build            |
| `npm run lint`       | Lint the project            |
| `npm run format`     | Check formatting (Prettier) |
| `npm run format:fix` | Auto-fix formatting         |

**[CONFIRM]** Script names may differ in `package.json`.

### Clean-run check (required for submission)

```bash
npm ci && npm test
npm run build && npm run lint && npm run format
```

---

## Features

### List screen

- Loading, loaded, empty, and error states
- Status filter that narrows both `visibleRows` and the rendered table

### Detail screen

- Accurate diff with **totals** and **delta**
- Approval timeline in **chronological order**
- Approve and Reject actions gated by **both CR status and user policy**

### Safe actions

- Calls the provided mock API for Approve and Reject
- Prevents invalid and duplicate submissions
- Rejection requires a reason
- Slow and failed calls leave the view coherent (no stale UI state)

---

## Project Structure

Follow the layout already in the repo. If starting fresh, this is the
recommended shape:

```
src/app/
├── core/                  # API client, interceptors, auth/permissions, errors
├── shared/                # reusable presentational UI
└── features/
    └── change-requests/
        ├── models/        # CR, diff, timeline, status, policy types
        ├── data/          # API service (HTTP only)
        ├── state/         # list and detail stores
        ├── utils/         # pure logic: diff, totals/delta, sorting, can-act
        ├── list/
        └── detail/
```

**[CONFIRM]** Replace with the actual tree once you have inspected the repo.

---

## State Management

UI state is modeled **explicitly** rather than with loose booleans:

```ts
type LoadState<T> = { status: "idle" } | { status: "loading" } | { status: "loaded"; data: T } | { status: "empty" } | { status: "error"; error: AppError };
```

Approve/Reject use a separate `ActionState` (`idle | submitting | failed`).
Derived values such as `visibleRows` are **computed**, not stored.

---

## Mock API

The mock API contract is provided with the assessment repository.

**[CONFIRM]** Document here: base URL or how the mock is started, available
endpoints, request/response shapes, and the error format.

---

## Testing

Tests are **rendered-behavior** tests (component/DOM), not implementation tests.

Coverage expected:

- List states and filtering
- Diff and timeline behavior
- Permission gating (read-only users cannot act)
- Action flows (success, failure, in-flight, duplicate prevention)
- Reject validation (empty and whitespace reasons blocked)

```bash
npm test
```

---

## Deliverables

- [ ] Git repository with full, non-squashed commit history
- [ ] `IMPLEMENTATION_NOTES.md` at the repo root (1 to 2 pages): screens and
      component state, assumptions, testing strategy, AI usage, tradeoffs
- [ ] `npm ci && npm test` passes from a clean clone
- [ ] Build, lint, and formatting checks pass
- [ ] 5 to 8 minute walkthrough recording (list, detail, a rejection, an error
      state, and one non-trivial frontend decision)

---

## AI Usage

AI tools are allowed and expected. Disclose where and how they were used in
`IMPLEMENTATION_NOTES.md`. See [`AGENTS.md`](./AGENTS.md) for the instructions
given to the coding agent.

---

## Documentation Index

| File                      | Purpose                                 |
| ------------------------- | --------------------------------------- |
| `CANDIDATE_BRIEF.md`      | Detailed requirements (source of truth) |
| `AGENTS.md`               | Instructions for AI coding agents       |
| `IMPLEMENTATION_NOTES.md` | Your engineering notes (to be written)  |
