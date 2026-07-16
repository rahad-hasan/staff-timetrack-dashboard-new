# Payroll Dashboard — Change Request (v2)

> Delta document for the dashboard/client-side agent.
> The backend payroll module was fixed on **2026-07-15**. Several client-visible
> behaviors have changed. Apply the changes in this document. This supersedes
> the corresponding sections of
> [`payroll_dashboard_client_implementation_guide.md`](./payroll_dashboard_client_implementation_guide.md).

---

## 1. Why this change

The first release had two production bugs surfaced by a real HR-generated run:

1. `target_hours` was calculated as **all calendar days × 8h** (e.g. 240h for June 2026), which caused every fixed-salary employee with `is_deduct_salary=true` to receive a massive incorrect deduction and every overtime-enabled employee to miss their overtime pay.
2. The client was sending `target_hours_month` on the payroll profile form, which the backend then used as an authoritative override — bypassing the Schedule / weekend / holiday logic that the spec requires.

Both are now fixed on the backend. The frontend needs to be updated to match.

---

## 2. Summary of client-visible changes

| # | What changed                                        | Client action                                                        |
|---|-----------------------------------------------------|----------------------------------------------------------------------|
| 1 | Backend no longer accepts `target_hours_month`      | **Remove the "Monthly target hours" field** from the profile form.  |
| 2 | Backend uses `Company.week_start` + `weekly_leave_count` for weekends | **Expose both in the Company Settings UI** so HR can configure. |
| 3 | Backend uses the employee's `Schedule` for per-day hours | Encourage HR to assign a Schedule to every employee (see §5).   |
| 4 | Weekday holidays are now counted correctly           | No form change — but update the "Payslip breakdown" copy (§6).      |
| 5 | Backend response shape unchanged                    | No API-client change; existing typings still valid.                 |

---

## 3. Change #1 — Remove "Monthly target hours" from the Payroll Profile form

### Before

The old form (per the v1 guide) included a numeric field:

```
Monthly target hours   [ 170  ]
```

And the request body carried it:

```json
{
  "user_id": 42,
  "salary_type": "monthly_fixed",
  "monthly_salary": 30000,
  "target_hours_month": 170,          ← REMOVE
  "effective_from": "2026-07-01"
}
```

### After

**Delete the field entirely** from both the "Create profile" and "Update profile" forms. Do not send `target_hours_month` on any request. The backend will now compute target hours per payroll run from:

- The employee's assigned `Schedule` (`start_time`, `end_time`, `break_in_min`) — or 8h/day fallback if none assigned
- The count of weekdays in the payroll period — derived from `Company.week_start` + `Company.weekly_leave_count`
- Trimmed by the employee's join date and last-deactivation date

### New form layout (final)

```
Salary type                          (○ Monthly fixed  ○ Hourly)

──── if Monthly fixed ─────────────────────────────
Monthly salary                       [ 30000  ]  BDT
Deduct salary when target missed?    [ ✓ ]  ← only for monthly_fixed

──── if Hourly ───────────────────────────────────
Hourly rate                          [ 200    ]  BDT/hour

──── common ─────────────────────────────────────
Allow overtime?                      [ ✓ ]
Overtime multiplier                  [ 1.5 ]

Effective from                       [ 2026-07-01 ]
Effective to (optional)              [            ]

Currency                             [ BDT ]

(❌ NO "Monthly target hours" field — removed)
```

### Copy to add above the form

Recommended tooltip / helper text next to the salary field:

> **How is monthly target calculated?**
> Target hours are calculated automatically for each payroll run using this employee's Schedule and the company's weekend settings. To adjust, update the employee's Schedule or your Company Settings.

---

## 4. Change #2 — Expose weekend settings in Company Settings UI

Two `Company` fields now directly drive every payroll target calculation:

| Field                        | Type                       | Effect on payroll                                   |
|------------------------------|----------------------------|-----------------------------------------------------|
| `Company.week_start`         | enum (Monday .. Sunday)    | Which weekday starts a work week                    |
| `Company.weekly_leave_count` | integer (0..7, default 2)  | Number of trailing days in the week that are off    |

These fields already exist in the backend schema and are updatable via the existing `PATCH /company/*` endpoint (whatever your Company Settings screen already uses). No new API needed.

### Add to Company Settings screen

```
Work week
  Week starts on              [ Monday ▼ ]
  Weekend length              [ 2 days ▼ ]   ← 0..7

Preview: weekly weekends are  Saturday + Sunday
```

### Preview logic

Small helper the dashboard should render inline so HR sees exactly which days will be weekends:

```ts
const WEEKDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function weekendPreview(week_start: string, weekly_leave_count: number): string {
  const ISO: Record<string, number> = {
    Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4,
    Friday: 5, Saturday: 6, Sunday: 7,
  };
  const startIso = ISO[week_start] ?? 1;
  const count = Math.max(0, Math.min(7, weekly_leave_count));
  const days: string[] = [];
  for (let i = 7 - count; i < 7; i++) {
    const iso = ((startIso - 1 + i) % 7) + 1;
    days.push(WEEKDAYS[iso - 1]);
  }
  return days.length ? days.join(' + ') : 'None (7-day work week)';
}

// Examples:
weekendPreview('Monday', 2)   // "Sat + Sun"       — standard
weekendPreview('Sunday', 2)   // "Fri + Sat"       — Bangladesh, ME
weekendPreview('Saturday', 1) // "Fri"             — KSA
weekendPreview('Monday', 0)   // "None (7-day work week)"
```

### Warning banner when HR changes these

Add a soft warning when saving:

> Changing weekend settings affects **future** payroll runs only. Already-generated runs keep their original target hours.

---

## 5. Change #3 — Nudge HR to assign Schedules

Not a mandatory change, but strongly recommended for HR-UX:

On the **Payroll Settings** page (§4 in the v1 guide, `/payroll/settings`), add a warning icon next to any employee whose profile is configured but who has **no ScheduleAssign**. Fetch this from your existing Schedule API and cross-reference. Tooltip:

> This employee has no assigned Schedule. Payroll will use the default 8h/day. [Assign schedule →]

The CTA should deep-link to the existing Schedule Assignment screen.

---

## 6. Change #4 — Update the "Payslip breakdown" copy on My Payslips

The `calculation_snapshot` now includes the correct semantics for weekday holidays. Update your snapshot renderer's copy so employees understand:

### Old row rendering (incorrect)

```
Holiday hours                +16h  (16h × ৳200)
```

### New row rendering

```
Paid holidays                 2 weekday holidays  ⇒  +16h
                              (your schedule × the number of weekday holidays)
```

If `holiday_hours === 0`, hide the row. If a holiday falls on a weekend, it does **not** appear — the backend already filters those out.

Same for the target line:

```
Target hours this month       176h
                              22 workdays × 8h (Mon–Fri; company weekends: Sat + Sun)
```

You can compute the workday count on the client for display purposes as `target_hours / per_day_hours`. Round to the nearest integer.

---

## 7. What did NOT change (safe to keep as-is)

- Response envelope (`{ statusCode, data, message, success, meta? }`) — unchanged
- All `EmployeePayroll` response fields — unchanged (`target_hours`, `worked_hours`, `leave_hours`, `holiday_hours`, `overtime_hours`, etc.)
- All `PayrollRun` response fields — unchanged
- Endpoint URLs and HTTP methods — unchanged
- CSV export format — unchanged
- Permission matrix — unchanged
- Approval flow — unchanged

You only need to change **input fields** on the Payroll Profile form and **add** the Company Settings weekend controls. Everything else stays.

---

## 8. TypeScript type update

Update your local `EmployeePayrollProfile` interface — remove `target_hours_month`:

```diff
 export interface EmployeePayrollProfile {
   id: number;
   company_id: number;
   user_id: number;
   salary_type: PayrollSalaryType;
   monthly_salary: number;
   hourly_rate: number;
   overtime_allow: boolean;
   overtime_multiplier: number;
   is_deduct_salary: boolean;
-  target_hours_month: number | null;
   currency: string;
   effective_from: string;
   effective_to: string | null;
   // ...
 }
```

And the request bodies:

```diff
 export type CreateProfileBody = {
   user_id: number;
   salary_type: 'monthly_fixed' | 'hourly';
   monthly_salary: number;
   hourly_rate: number;
   overtime_allow: boolean;
   overtime_multiplier: number;
   is_deduct_salary: boolean;
-  target_hours_month?: number | null;
   effective_from: string;
   effective_to?: string | null;
   currency?: string;
 };

 export type UpdateProfileBody = Partial<CreateProfileBody> & {
   is_active?: boolean;
 };
-// remove target_hours_month from the resulting partial as well
```

The `EmployeePayroll` **response** type keeps `target_hours` — that field is set by the backend and returned in every payslip. Don't remove that.

---

## 9. Testing checklist before you ship

- [ ] Payroll profile form no longer has a "Monthly target hours" field
- [ ] Submitting the profile form does NOT include `target_hours_month` in the request body (verify in DevTools Network tab)
- [ ] Company Settings screen has "Week starts on" dropdown and "Weekend length" input
- [ ] Weekend preview label updates live as HR changes the values
- [ ] Generate a test payroll for **June 2026** (30-day month, Mon-start week, 2-day weekend) → verify each employee's target shows **176h** (not 240h)
- [ ] For an employee who worked 180h that same month with `overtime_allow=true`, verify `overtime_hours = 4` and the overtime pay line appears
- [ ] For an employee who worked 180h with `is_deduct_salary=true`, verify `deduction_amount = 0` (target was met)
- [ ] Payslip breakdown on `/payroll/my-payslips` shows the correct "22 workdays × 8h" explanation

---

## 10. Rollout note

The backend is fully backward-compatible in both directions:
- **Responses** are unchanged, so old dashboard builds keep working.
- **Requests** silently drop `target_hours_month` if a stale dashboard sends it (Zod strips unknown keys — no error). The important part is that the backend *ignores* the value, so old clients will no longer override the target with a stale hardcoded number.

That said, ship the dashboard change quickly. As long as the field is still shown in the UI, HR users will believe they're setting a target that in fact does nothing — a silent-bug experience is worse than a visible one.

**Recommended order:** backend → dashboard, within the same release train.

Ship it.
