# Candidate Brief: Change Request Review UI (Angular)

> **Note on provenance:** This brief was reconstructed from the accompanying
> assessment summary (_Frontend Engineering Take-Home, Penny Software Arabia_).
> Items marked **[CONFIRM]** are not stated in the summary and must be checked
> against the real repository (models, fixtures, mock API contract).

---

## 1. At a Glance

|                    |                                         |
| ------------------ | --------------------------------------- |
| **Time budget**    | 10 to 16 focused hours                  |
| **Working window** | Across 4 days                           |
| **Stack**          | Angular 15 + Jest                       |
| **Primary signal** | Explicit UI state and rendered behavior |

This exercise mirrors a normal frontend slice at Penny. You will **complete an
existing Angular reviewer experience** for Change Requests against a **provided
mock API contract**.

If you reach the time limit, **stop and document what remains**. Thoughtful
scoping is part of the signal.

---

## 2. Assignment

Build a clear reviewer flow that helps an approver:

1. **Find** a Change Request (CR),
2. **Understand** the proposed changes and history,
3. **Approve or reject** it,

while respecting **user permissions** and handling **loading, empty, slow, and
failing** states.

---

## 3. Working Principles

- **Keep the existing architecture and code style.**
- Prefer **clarity and correctness** over cleverness.
- Use the **provided error patterns**.
- **Avoid new heavyweight dependencies** unless you explain the reason in
  `IMPLEMENTATION_NOTES.md`.
- You must understand, explain, and be able to modify every part of your
  submission.

---

## 4. What to Complete

### Task 1: Orient and document

Read the README, models, fixtures, and templates. In `IMPLEMENTATION_NOTES.md`
describe:

- the screens and component state,
- assumptions,
- testing strategy,
- AI usage,
- tradeoffs.

### Task 2: Fix the starting failures

There are two intentional defects:

| #   | Defect                                   | Expected outcome                                                                                       |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 2a  | **Diff/preview classification** is wrong | Fields are classified correctly (added / removed / changed / unchanged) **[CONFIRM exact categories]** |
| 2b  | **Detail-page permission** defect        | Approve is **not** offered to an unauthorized user                                                     |

### Task 3: Complete the list experience

- Keep **loading, loaded, empty, and error** states correct.
- Implement the **status filter** so that **both** `visibleRows` **and** the
  rendered table narrow correctly.

### Task 4: Complete the detail experience

- Render an **accurate diff** with **totals and delta**.
- Order the **approval timeline chronologically**.
- Keep **action availability dependent on both status and policy**.

### Task 5: Implement safe actions

- Call the **provided API** for Approve and Reject.
- **Prevent invalid or duplicate** actions.
- **Require a rejection reason.**
- **Preserve a coherent view** during slow or failed calls.

### Task 6: Add rendered-behavior tests

Use **component/DOM tests** to cover:

- list states and filtering,
- diff and timeline behavior,
- permission gating,
- action flows,
- failure paths,
- reject validation.

---

## 5. Acceptance Criteria

### List screen

- [ ] Distinct, correct **loading**, **loaded**, **empty**, and **error** states.
- [ ] Status filter works; `visibleRows` and the rendered table agree.

### Detail screen

- [ ] Diff is accurate, with **totals** and **delta**.
- [ ] Approval timeline is in **chronological order**.
- [ ] Action availability reflects **status AND policy**.

### Actions

- [ ] Read-only users **cannot** act.
- [ ] Approve and Reject handle **slow** and **failed** responses without leaving
      stale UI state.
- [ ] Rejection **requires a reason**; the API is not called without one.
- [ ] Duplicate submissions are prevented while a request is in flight.

### Tests and quality

- [ ] **All original and added tests pass from a clean install.**
- [ ] Tests assert on **rendered DOM behavior**, not only internal state.
- [ ] Build, lint, and formatting checks pass.

---

## 6. Evaluation Criteria

Your work will be evaluated on:

1. All original and added tests pass from a clean install.
2. The list has a working status filter and clear loading, empty, and error
   states.
3. The detail view shows an accurate diff, totals/delta, and a chronological
   timeline.
4. Actions respect both CR status and user permissions; read-only users cannot
   act.
5. Approve/Reject handle slow and failed responses without leaving stale UI
   state.

---

## 7. Submission Checklist

| Item                  | Requirement                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Repository**        | Git repository with **full commit history**. Do **not** squash to a single commit.                                                                                       |
| **Engineering notes** | `IMPLEMENTATION_NOTES.md` at the repository root (aim for 1 to 2 pages).                                                                                                 |
| **Walkthrough**       | 5 to 8 minute screen recording covering the list and detail screens, **including a rejection and an error state**, and explaining **one non-trivial frontend decision**. |
| **Clean run**         | `npm ci && npm test` works from a clean clone. Run **build, lint, and formatting checks** before submission.                                                             |

Follow the delivery instructions from your Penny recruiting contact, and call
out any special setup or unfinished work clearly.

---

## 8. AI Tools

AI tools are **allowed and expected**. Briefly disclose where and how you used
AI in `IMPLEMENTATION_NOTES.md`. You should understand and be able to explain
and modify every part of your submission.

---

## 9. Follow-up Conversation

Expect a **45 to 60 minute** discussion covering:

- your **component model**,
- a **small live UI change**,
- a **debugging scenario** around action state or network behavior.

---

## 10. Items to Confirm in the Repository

These details are not in the summary document and must be read from the repo:

- **[CONFIRM]** Exact CR status values and which are actionable.
- **[CONFIRM]** Permission/policy model (how "read-only" and "unauthorized" are
  represented).
- **[CONFIRM]** Mock API endpoints, request and response shapes, and error format.
- **[CONFIRM]** Diff entry categories and how totals and delta are defined.
- **[CONFIRM]** Timeline event shape and timestamp field used for ordering.
- **[CONFIRM]** Whether the app uses NgModules or standalone components.
- **[CONFIRM]** Location and names of fixtures and the provided error pattern.
