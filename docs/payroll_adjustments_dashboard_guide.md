# Payroll Manual Adjustments — Dashboard Integration Guide

**Audience:** Frontend / dashboard engineers
**Backend status:** Implemented on branch `payroll` (migration `20260720090000_payroll_adjustments`).
**Base URL:** all paths below are under `/api/v1`.

---

## 1. What this feature does

HR / Admin can, on a **generated (not-yet-approved)** payroll run, adjust an individual
employee's pay in two ways:

1. **Waive the deduction** for the month — the amount that was deducted because of a
   work-duration gap is added back, so that employee is *not* deducted this month even
   though the calculation produced a deduction.
2. **Add one or more bonuses** — free-text `title` + `amount`. Amount is in the
   **employee's payroll currency** (the same currency shown on their payroll row).
   An employee can have **zero, one, or many** bonus lines.

Both are optional and independent. The salary math the backend applies:

```
final_salary = gross_salary + waived_amount + adjustment_total
```

- `gross_salary` — unchanged by adjustments (what the calculation produced).
- `waived_amount` — the deduction added back (0 if not waived, or if there was no deduction).
- `adjustment_total` — sum of all bonus amounts.
- The converted values (`*_converted`, in the run currency) are recomputed with the
  same snapshotted `exchange_rate`.

> Only `monthly_fixed` employees can have a deduction, so `waive_deduction` is
> meaningful for them. Sending `waive_deduction: true` for an employee whose
> deduction is 0 (hourly, or a full-attendance month) is accepted and simply
> results in `waived_amount = 0` — safe no-op.

---

## 2. The one new endpoint

### `PUT /payroll/run/:id/employee/:user_id/adjustments`

- **Auth:** `admin` or `hr` only.
- **Semantics: REPLACE.** The body is the *complete* adjustment set you want persisted
  for that employee. This is **not** a patch/append. To add a bonus to an employee who
  already has one, send **both** bonuses in the array. To remove everything, send an
  empty set (see §5).

**Path params**
| param | meaning |
|-------|---------|
| `id` | `payroll_run_id` |
| `user_id` | the employee's user id |

**Request body**

```jsonc
{
  "waive_deduction": true,          // optional, default false
  "bonuses": [                      // optional, default []
    { "title": "Eid bonus",   "amount": 5000 },
    { "title": "Referral",    "amount": 2500.50 }
  ]
}
```

**Validation (enforced server-side — mirror it in the form):**
| field | rule |
|-------|------|
| `waive_deduction` | boolean, default `false` |
| `bonuses` | array, **max 20 items**, default `[]` |
| `bonuses[].title` | non-empty after trim, **max 100 chars** |
| `bonuses[].amount` | number, **> 0**, finite, ≤ 100,000,000 |

**Success — `200`**

```jsonc
{
  "statusCode": 200,
  "success": true,
  "message": "Payroll adjustments saved successfully",
  "data": {
    "item": {                       // the updated EmployeePayroll row
      "id": 501,
      "user_id": 86,
      "currency": "USD",
      "gross_salary": 500,
      "deduction_amount": 100,
      "adjustment_total": 7500.50,
      "deduction_waived": true,
      "waived_amount": 100,
      "final_salary": 8100.50,
      "final_salary_converted": 8100.50,
      "exchange_rate": 1
      // ...all other EmployeePayroll fields
    },
    "adjustments": [                 // the persisted line items (after replace)
      { "id": 12, "type": "bonus", "title": "Eid bonus", "amount": 5000, "currency": "USD", "created_by": 3, "created_at": "..." },
      { "id": 13, "type": "bonus", "title": "Referral",  "amount": 2500.50, "currency": "USD", "created_by": 3, "created_at": "..." },
      { "id": 14, "type": "deduction_waiver", "title": "Deduction waived", "amount": 0, "currency": "USD", "created_by": 3, "created_at": "..." }
    ]
  }
}
```

**Error responses the UI must handle**
| HTTP | when | UI behaviour |
|------|------|--------------|
| `400` | run is already `approved`/`paid` | Show "This run is approved and locked." Disable the edit UI and refresh the run. |
| `400` | run was approved *while* you were saving (race) | Same as above — toast + refetch. |
| `404` | run not found, or **adding** a bonus to an employee not in this run | Refetch the run/list. |
| `409` | run is being regenerated right now (lock contention) | Show "Payroll is regenerating, please retry in a moment." Offer a Retry button. |
| `403` | caller is not admin/hr | Hide the feature. |

---

## 3. Reading adjustments back (existing endpoints, now enriched)

You do **not** need extra calls to display adjustments — the existing read endpoints now
include them.

### `GET /payroll/run/:id` (run detail — HR/Admin view)

Each entry in `data.items[]` now carries **three new scalar columns** and an
**`adjustments[]` array**:

```jsonc
{
  // ...existing item fields...
  "adjustment_total": 7500.50,
  "deduction_waived": true,
  "waived_amount": 100,
  "final_salary": 8100.50,           // already includes adjustments
  "adjustments": [
    { "id": 12, "type": "bonus", "title": "Eid bonus", "amount": 5000, "currency": "USD", "applied": true },
    { "id": 14, "type": "deduction_waiver", "title": "Deduction waived", "amount": 0, "currency": "USD", "applied": true }
  ]
}
```

### `GET /payroll/history` (employee's own payslip history, and HR viewing a user)

Same `adjustments[]` shape attached per historical row.

> **Visibility rule:** when a normal employee views **their own** history, adjustment
> line items are only included for **approved/paid** runs — provisional HR decisions on
> a still-`generated` run are hidden from them. HR/Admin always see them. (The numeric
> totals were always visible; this only gates the free-text line items.)

### The `applied` flag — **important**

Every adjustment returned from read endpoints has a boolean **`applied`**:

- `applied: true` — this line is reflected in `final_salary`.
- `applied: false` — this line was **skipped** on the last regenerate (its currency no
  longer matches the employee's payroll currency) and is **not** in `final_salary`.

Render `applied: false` rows visibly de-emphasised (e.g. greyed with a "not applied —
currency changed" badge). Do **not** show them as if they were paid, and do **not** add
their amount to any total you compute client-side — always trust the server's
`final_salary` / `adjustment_total`.

---

## 4. CSV export (`GET /payroll/run/:id/export`)

Three new columns were added between `deduction_amount` and `overtime_amount`:
`deduction_waived`, `waived_amount`, and `bonus_total` (= `adjustment_total`). No UI
change needed beyond noting the wider file; existing download button works unchanged.

---

## 5. Clearing adjustments

Send an empty set to remove everything for an employee:

```json
PUT /payroll/run/12/employee/86/adjustments
{ "waive_deduction": false, "bonuses": [] }
```

This deletes all their bonus/waiver lines and restores `final_salary` to `gross_salary`.
(Edge case handled by backend: if the employee has since dropped out of the run, an empty
clear is still accepted as a no-op so stale rows can be cleaned up.)

---

## 6. Recommended dashboard UX

### 6.1 Run-detail table (HR/Admin)
- Add a **"Deduction"** cell showing `deduction_amount`; when `deduction_waived` is true,
  strike it through and show a **"Waived"** chip.
- Add a **"Bonus"** column = `adjustment_total` (with a tooltip/expander listing the
  `adjustments[]` bonus titles + amounts).
- **`final_salary`** is the source of truth for the payable column — it already includes
  adjustments. Never recompute it on the client.
- Add an **"Adjust"** action per row → opens the editor modal (§6.2). Disable the action
  entirely when `run.status` is `approved` or `paid`.

### 6.2 Adjustment editor modal (per employee)
- Prefill from the row's current `adjustments[]` and flags (this is a REPLACE editor —
  load the full current set, let the user edit, submit the whole set).
- A **"Waive this month's deduction"** toggle. Show the current `deduction_amount` next to
  it so HR knows what they're waiving; if it's 0, show a hint that there's nothing to waive.
- A **repeatable bonus row** list: `title` + `amount` (currency label = employee's
  `currency`), add/remove buttons, max 20.
- **Live preview:** `final = gross + (waive ? deduction : 0) + Σ amounts`. Mirror the
  server formula so HR sees the result before saving.
- On submit → `PUT`; on success replace the row from `data.item` in the response.
- Show currency explicitly on every amount input — bonuses are in the **employee's**
  currency, not the run currency.

### 6.3 Employee payslip / history
- Under the salary breakdown, itemise `adjustments[]` (bonus titles + amounts) and show a
  **"Deduction waived"** line when applicable.
- Respect the `applied` flag (§3) — hide or clearly mark non-applied lines.

---

## 7. Behaviour you should know (so the UI stays correct)

1. **Adjustments survive regeneration.** If HR re-generates (`force`) the run after adding
   adjustments, the backend re-applies them automatically to the fresh rows. The UI does
   not need to re-send them. After a regenerate, just refetch the run.
2. **Currency change ⇒ stale bonus.** If an employee's payroll currency is changed and the
   run is regenerated, previously-entered bonuses in the old currency are **not** re-applied
   (they'd be ambiguous). They come back with `applied: false`. HR should re-enter them in
   the new currency. Surface this state clearly rather than silently.
3. **Approved runs are frozen.** Once a run is `approved` or `paid`, adjustments cannot be
   changed. Gate the whole editing UI on `run.status ∈ {draft, generated}`.
4. **Totals.** `run.total_gross` is unaffected by adjustments; `run.total_net` reflects them.
   Use server totals — do not sum on the client.
5. **Concurrency.** A `409` means a generate/regenerate for the same month is in flight.
   It's transient — a retry after a moment will succeed.

---

## 8. Quick reference

| Action | Call |
|--------|------|
| Add / edit / replace adjustments | `PUT /payroll/run/:id/employee/:user_id/adjustments` |
| Clear all adjustments | `PUT` same endpoint with `{ "waive_deduction": false, "bonuses": [] }` |
| See adjustments (HR run view) | `GET /payroll/run/:id` → `items[].adjustments[]` + new scalar fields |
| See adjustments (payslip) | `GET /payroll/history` → `data[].adjustments[]` |
| Export | `GET /payroll/run/:id/export` (3 new columns) |
