# Payroll Dashboard — Client-Side Implementation Guide

> Written for the dashboard/client-side engineer implementing the Payroll UI on top of the newly shipped `/api/v1/payroll/*` module.
> Follow this document top-to-bottom; every endpoint, payload, response, edge case, and UX flow is defined here.

---

## 0. TL;DR — What you are building

Five screens, plus role-gated navigation:

| # | Screen                         | Route                              | Who can access       |
|---|--------------------------------|------------------------------------|----------------------|
| 1 | Payroll Settings (profiles)    | `/payroll/settings`                | `admin`, `hr`        |
| 2 | Payroll Profile Editor         | `/payroll/settings/:userId`        | `admin`, `hr`        |
| 3 | Generate Payroll               | `/payroll/generate`                | `admin`, `hr`        |
| 4 | Payroll Runs (history + list)  | `/payroll/runs`                    | `admin`, `hr`        |
| 5 | Payroll Run Details            | `/payroll/runs/:runId`             | `admin`, `hr`        |
| 6 | My Payslips                    | `/payroll/my-payslips`             | any authenticated    |

All endpoints live under `/api/v1/payroll` and require the standard `Authorization: Bearer <accessToken>` header (or the `accessToken` cookie).

---

## 1. Backend context you need to know

- **Response envelope** — every JSON response uses:
  ```ts
  {
    statusCode: number,
    data: T,
    message: string,
    success: boolean,     // true when statusCode < 400
    meta?: { page, limit, total, totalPages }
  }
  ```
  On errors (4xx/5xx), `success = false`, `data = null`, and `message` explains why.

- **Roles** — the DB has `admin`, `hr`, `manager`, `project_manager`, `employee`, `super_admin`, `support_agent`, `marketing`. Payroll write access is gated to **`admin` + `hr`**. The spec refers to "Owner" — there is no separate `owner` role; treat `admin` as Owner.

- **Currency** — every profile/run/item carries an ISO currency string (e.g. `"BDT"`, `"USD"`). Always render amounts using the item's `currency` field, never assume USD.

- **Hours** — every `*_hours` field is a **decimal number of hours** (e.g. `158.5`). Format with `HH:mm` or `HH:mm:ss` in the UI where appropriate.

- **Dates** — profile date fields (`effective_from`, `effective_to`) are `YYYY-MM-DD` strings. Run period fields (`period_start`, `period_end`) are ISO datetime strings.

- **Statuses**
  - `PayrollSalaryType`: `monthly_fixed` | `hourly`
  - `PayrollRunStatus`: `draft` | `generated` | `approved` | `paid`
  - State transitions: `draft → generated → approved → paid`. Once `approved` or `paid`, the run is **immutable**; the backend will refuse regeneration.

---

## 2. TypeScript types — copy these into `src/types/payroll.ts`

```ts
export type PayrollSalaryType = 'monthly_fixed' | 'hourly';
export type PayrollRunStatus = 'draft' | 'generated' | 'approved' | 'paid';

export interface EmployeePayrollProfile {
  id: number;
  company_id: number;
  user_id: number;
  salary_type: PayrollSalaryType;
  monthly_salary: number;      // 0 for hourly employees
  hourly_rate: number;         // 0 for monthly_fixed employees
  overtime_allow: boolean;
  overtime_multiplier: number; // default 1.5
  is_deduct_salary: boolean;   // only valid for monthly_fixed
  target_hours_month: number | null;
  currency: string;
  effective_from: string;      // YYYY-MM-DD
  effective_to: string | null; // YYYY-MM-DD | null (open-ended)
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;          // ISO datetime
  updated_at: string;
  user?: {                     // included in list endpoint
    id: number;
    name: string;
    email: string;
    image: string | null;
    role: string;
  };
}

export interface PayrollRun {
  id: number;
  company_id: number;
  month: number;               // 1..12
  year: number;
  period_start: string;        // ISO datetime
  period_end: string;
  status: PayrollRunStatus;
  currency: string;
  total_employees: number;
  generated_count: number;
  failed_count: number;
  total_gross: number;
  total_net: number;
  generated_by: number | null;
  approved_by: number | null;
  approved_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  generatedBy?: { id: number; name: string; email: string } | null;
  approvedBy?: { id: number; name: string; email: string } | null;
}

export interface EmployeePayroll {
  id: number;
  payroll_run_id: number;
  company_id: number;
  user_id: number;
  profile_id: number | null;
  salary_type: PayrollSalaryType;
  currency: string;

  // Hour breakdown
  target_hours: number;
  worked_hours: number;
  leave_hours: number;
  holiday_hours: number;
  overtime_hours: number;
  payable_hours: number;

  // Rates
  basic_salary: number;
  hourly_rate: number;
  overtime_multiplier: number;

  // Amounts
  deduction_amount: number;
  overtime_amount: number;
  gross_salary: number;
  final_salary: number;

  calculation_snapshot: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;

  user?: {
    id: number;
    name: string;
    email: string;
    image: string | null;
    role: string;
  };
  payrollRun?: Pick<
    PayrollRun,
    'id' | 'month' | 'year' | 'status' | 'period_start' | 'period_end' | 'approved_at' | 'paid_at'
  >;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}
```

---

## 3. API reference — full endpoint contract

Base URL: `/api/v1/payroll`
All routes: `Authorization: Bearer <accessToken>` required.
All 4xx/5xx follow the standard envelope with `success: false`.

### 3.1 Create payroll profile

`POST /payroll/profile` — **admin, hr**

Creates a new active profile for an employee. Fails if the effective window overlaps an existing active profile for the same user.

Request body:
```json
{
  "user_id": 42,
  "salary_type": "monthly_fixed",
  "monthly_salary": 30000,
  "hourly_rate": 0,
  "overtime_allow": true,
  "overtime_multiplier": 1.5,
  "is_deduct_salary": true,
  "target_hours_month": 170,
  "effective_from": "2026-07-01",
  "effective_to": null,
  "currency": "BDT"
}
```

Field rules:
- `salary_type = "monthly_fixed"` → `monthly_salary > 0` required, `hourly_rate` optional.
- `salary_type = "hourly"` → `hourly_rate > 0` required, `is_deduct_salary` **must** be `false`.
- `overtime_multiplier` must be between 1 and 10 (default 1.5).
- `effective_to` is either `null` (open-ended) or `>= effective_from`.
- `currency` defaults to the target user's currency, then to `"USD"`.

Response `201`:
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Payroll profile created successfully",
  "data": { /* EmployeePayrollProfile */ }
}
```

Common errors:
- `404` — `"User not found in this company"`
- `400` — `"An active payroll profile already exists for this user starting YYYY-MM-DD..."`
- `400` — Zod validation errors (salary mismatch, overtime multiplier out of range, etc.)

---

### 3.2 List payroll profiles

`GET /payroll/profile?user_id=&is_active=&page=&limit=` — **admin, hr**

Query params (all optional):
- `user_id: number` — filter to a single employee
- `is_active: boolean` — `true` or `false`
- `page: number` — default `1`
- `limit: number` — default `25`, max `200`

Response `200`:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Payroll profiles retrieved",
  "data": [ /* EmployeePayrollProfile[] with `user` populated */ ],
  "meta": { "page": 1, "limit": 25, "total": 128, "totalPages": 6 }
}
```

Use this to render the payroll settings table.

---

### 3.3 Get an employee's profile history

`GET /payroll/profile/:userId` — **any authenticated** (employees can only fetch their own)

Returns **all** profiles for the user (active + inactive + historical), ordered by `effective_from DESC`. Use this to render the "salary history" view for an employee.

Response `200`:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Payroll profile retrieved successfully",
  "data": [ /* EmployeePayrollProfile[] */ ]
}
```

If a non-admin/hr caller passes a `:userId` that isn't their own → `403 "You cannot view this profile"`.

---

### 3.4 Update a payroll profile

`PUT /payroll/profile/:id` — **admin, hr**

Partial update — send only the fields you want to change. At least one field is required.

Request body (all optional):
```json
{
  "salary_type": "monthly_fixed",
  "monthly_salary": 35000,
  "hourly_rate": 0,
  "overtime_allow": true,
  "overtime_multiplier": 1.5,
  "is_deduct_salary": true,
  "target_hours_month": 170,
  "effective_from": "2026-08-01",
  "effective_to": null,
  "currency": "BDT",
  "is_active": true
}
```

Response `200`: updated `EmployeePayrollProfile`.

**Business rule the UI must communicate:**
When editing a historical profile whose `effective_to` is already in the past AND it has been used by an approved/paid run, the API returns `400 "Cannot modify a historical profile referenced by an approved run"`. In that case, guide the user to create a **new** profile with the corrected values instead.

**Preferred UX for salary raise:** don't edit the current active profile in-place. Instead:
1. Set `effective_to` on the current profile (e.g. today).
2. Create a fresh profile with the new salary and `effective_from` set to tomorrow. This preserves the audit trail exactly as the spec requires.

---

### 3.5 Generate payroll

`POST /payroll/generate` — **admin, hr**

Request body:
```json
{
  "month": 7,
  "year": 2026,
  "notes": "July 2026 payroll",
  "force": false
}
```

- `month` 1..12, `year` 2000..2100.
- `notes` optional (≤ 2000 chars).
- `force: true` is required if a `draft` or `generated` run already exists for this period. The backend will **wipe** existing `EmployeePayroll` rows for that run and rebuild.
- If the run is already `approved` or `paid`, the endpoint returns `400` regardless of `force`.

Response `201`:
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Payroll generated successfully",
  "data": {
    "payroll_run_id": 87,
    "month": 7,
    "year": 2026,
    "status": "generated",
    "total_employee": 120,
    "generated": 118,
    "failed": 2,
    "skipped": [
      { "user_id": 55, "reason": "no_active_payroll_profile" },
      { "user_id": 77, "reason": "no_active_payroll_profile" }
    ]
  }
}
```

**UX contract:**
- On success, redirect to `/payroll/runs/:payroll_run_id`.
- If `failed > 0`, render a warning banner listing the skipped users with a CTA "Set up their payroll profile", linking each to `/payroll/settings/:user_id`.
- If backend returns `400 "A payroll run already exists in status generated. Pass force=true..."`, show a confirmation modal: **"A draft run already exists for this month. Regenerating will replace it and cannot be undone."** — on confirm, retry with `force: true`.

**Performance expectation:** generation is synchronous and can take multiple seconds for large tenants. Show a full-screen loading state with progress messaging ("Fetching employees...", "Calculating salaries..."). Set the client timeout to at least **60 seconds**.

---

### 3.6 List payroll runs

`GET /payroll/runs?year=&month=&status=&page=&limit=` — **admin, hr**

Query params (all optional):
- `year: number`
- `month: number`
- `status: PayrollRunStatus`
- `page: number` (default 1)
- `limit: number` (default 20, max 100)

Response `200`:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Payroll runs retrieved successfully",
  "data": [
    {
      "id": 87,
      "month": 7,
      "year": 2026,
      "status": "generated",
      "currency": "BDT",
      "total_employees": 120,
      "generated_count": 118,
      "total_gross": 3540000,
      "total_net": 3540000,
      "period_start": "2026-06-30T18:00:00.000Z",
      "period_end": "2026-07-31T18:00:00.000Z",
      "generatedBy": { "id": 3, "name": "HR Manager", "email": "hr@..." },
      "approvedBy": null,
      "approved_at": null,
      "paid_at": null,
      "notes": null,
      "created_at": "2026-08-01T04:22:11.000Z",
      "updated_at": "2026-08-01T04:22:11.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

---

### 3.7 Payroll run details (with employee items)

`GET /payroll/run/:id?search=&page=&limit=` — **admin, hr**

Query params (all optional):
- `search: string` — filters items by employee name/email (case-insensitive contains)
- `page`, `limit` — default `1` / `50`, max `500`

Response `200`:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Payroll run retrieved successfully",
  "data": {
    "run": { /* PayrollRun with generatedBy/approvedBy */ },
    "items": [ /* EmployeePayroll[] with `user` populated */ ]
  },
  "meta": { "page": 1, "limit": 50, "total": 118, "totalPages": 3 }
}
```

**Screen layout:**
- Header card: month/year, status badge, generated/approved timestamps, totals (gross/net), currency.
- Actions (status-aware):
  - `generated` → show "Approve" primary button, "Regenerate" secondary, "Export CSV" tertiary.
  - `approved` / `paid` → hide "Approve" and "Regenerate"; "Export CSV" stays.
- Table columns: Employee, Salary Type, Target hrs, Worked, Leave, Holiday, Overtime hrs, Payable hrs, Basic, OT amount, Deduction, Final Salary.
- Expand-row: pretty-print `calculation_snapshot` (audit-transparent view).

---

### 3.8 Approve a run

`PATCH /payroll/run/:id/approve` — **admin, hr**

Request body:
```json
{ "notes": "Reviewed and approved by finance" }
```

Response `200`: updated `PayrollRun` with `status = "approved"`, `approved_by`, `approved_at` set.

Errors:
- `400 "Run is already approved"` / `"Run is already paid"`
- `400 "Generate the run before approving"` (only `draft` runs)

**UX:** show a confirm modal: "Approving this payroll run will lock all salaries for this period. Historical amounts cannot be edited afterwards." — require explicit confirmation.

---

### 3.9 Export CSV

`GET /payroll/run/:id/export?format=csv` — **admin, hr**

Response is a raw CSV stream:
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="payroll-YYYY-MM-run-<id>.csv"`

CSV columns:
```
employee_id, employee_name, employee_email, salary_type, currency,
target_hours, worked_hours, leave_hours, holiday_hours, overtime_hours,
payable_hours, basic_salary, hourly_rate, overtime_multiplier,
deduction_amount, overtime_amount, gross_salary, final_salary
```

Metadata block (as `# ` prefixed lines at the top): run period, status, currency, totals, export timestamp.

**Client:** use `window.location.href = url` **or** a blob download flow. Do NOT try to parse this response as JSON.

```ts
async function downloadPayrollCsv(runId: number) {
  const res = await fetch(`/api/v1/payroll/run/${runId}/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = res.headers
    .get('Content-Disposition')
    ?.split('filename=')[1]
    ?.replaceAll('"', '') ?? `payroll-run-${runId}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
```

---

### 3.10 Employee payslip history

`GET /payroll/history?user_id=&year=&page=&limit=` — **any authenticated**

Behavior:
- `admin`/`hr` may pass any `user_id` (defaults to their own if omitted).
- Everyone else's `user_id` is silently forced to their own — even if they pass a different value in the query string.

Response `200`:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Payroll history retrieved successfully",
  "data": [
    {
      "id": 512,
      "payroll_run_id": 87,
      "salary_type": "monthly_fixed",
      "currency": "BDT",
      "target_hours": 170,
      "worked_hours": 150,
      "leave_hours": 8,
      "holiday_hours": 0,
      "overtime_hours": 0,
      "payable_hours": 158,
      "basic_salary": 30000,
      "hourly_rate": 176.47,
      "deduction_amount": 2117.65,
      "overtime_amount": 0,
      "gross_salary": 27882.35,
      "final_salary": 27882.35,
      "calculation_snapshot": { /* ... */ },
      "payrollRun": {
        "id": 87, "month": 7, "year": 2026,
        "status": "approved",
        "period_start": "...", "period_end": "...",
        "approved_at": "..."
      }
    }
  ],
  "meta": { "page": 1, "limit": 24, "total": 12, "totalPages": 1 }
}
```

Use this to power `/payroll/my-payslips` and the "Salary history" tab on an employee's admin profile.

---

## 4. Implementation plan — step by step

### Step 1 — API client + types

1. Create `src/types/payroll.ts` with the types from §2.
2. Create `src/api/payroll.ts` with a thin wrapper around your existing axios/fetch instance:

```ts
import { api } from '@/api/client';
import type {
  ApiResponse, EmployeePayroll, EmployeePayrollProfile, PayrollRun,
  PayrollRunStatus,
} from '@/types/payroll';

export const PayrollApi = {
  // profiles
  createProfile: (body: CreateProfileBody) =>
    api.post<ApiResponse<EmployeePayrollProfile>>('/payroll/profile', body),
  listProfiles: (params: ListProfilesParams) =>
    api.get<ApiResponse<EmployeePayrollProfile[]>>('/payroll/profile', { params }),
  getProfileForUser: (userId: number) =>
    api.get<ApiResponse<EmployeePayrollProfile[]>>(`/payroll/profile/${userId}`),
  updateProfile: (id: number, body: UpdateProfileBody) =>
    api.put<ApiResponse<EmployeePayrollProfile>>(`/payroll/profile/${id}`, body),

  // runs
  generate: (body: { month: number; year: number; notes?: string; force?: boolean }) =>
    api.post<ApiResponse<GenerateResult>>('/payroll/generate', body),
  listRuns: (params: ListRunsParams) =>
    api.get<ApiResponse<PayrollRun[]>>('/payroll/runs', { params }),
  getRun: (id: number, params: RunDetailParams) =>
    api.get<ApiResponse<{ run: PayrollRun; items: EmployeePayroll[] }>>(
      `/payroll/run/${id}`,
      { params }
    ),
  approve: (id: number, body: { notes?: string } = {}) =>
    api.patch<ApiResponse<PayrollRun>>(`/payroll/run/${id}/approve`, body),
  exportUrl: (id: number) => `/api/v1/payroll/run/${id}/export`,

  // employee history
  myHistory: (params: HistoryParams) =>
    api.get<ApiResponse<EmployeePayroll[]>>('/payroll/history', { params }),
};
```

### Step 2 — React Query hooks (or your state library)

```ts
// hooks/usePayroll.ts
export const useRunsList = (filters: ListRunsParams) =>
  useQuery({
    queryKey: ['payroll', 'runs', filters],
    queryFn: () => PayrollApi.listRuns(filters).then((r) => r.data),
    staleTime: 30_000,
  });

export const useGeneratePayroll = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: PayrollApi.generate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll', 'runs'] }),
  });
};

export const useApproveRun = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      PayrollApi.approve(id, { notes }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['payroll', 'runs'] });
      qc.invalidateQueries({ queryKey: ['payroll', 'run', vars.id] });
    },
  });
};
```

Set the mutation `retry: false` and give the `useGeneratePayroll` mutation a **60-second timeout** — generation is not a fast call for 100k-user tenants.

### Step 3 — Navigation & role gating

- Add a "Payroll" top-level nav item, only visible when `user.role === 'admin' || user.role === 'hr'`.
- Employees see only "My Payslips" (linked from their profile menu, routing to `/payroll/my-payslips`).
- Wrap admin/hr routes in a `<RequireRole roles={['admin','hr']} />` guard — hitting the API without permission still returns `403`, so this is UX only.

### Step 4 — Payroll Settings screen (`/payroll/settings`)

Layout:
- Header with filter chips: All / Active / Inactive / Missing profile.
- Search box (client-side over `user.name`, `user.email`).
- Table: Employee, Salary Type, Monthly / Hourly rate, Currency, Overtime, Deduction, Effective from → to, Status.
- Row actions: **Edit**, **Deactivate**, **View history**.
- Empty state for employees with no profile: prompt "Set up payroll" → opens the profile editor drawer.

Data source: `PayrollApi.listProfiles({ page, limit, is_active })` — paginate server-side.

To find employees who have **no** profile at all, run a second query in parallel: your existing `/users` listing minus the users returned in the profiles list. Show them under a "Not configured" tab.

### Step 5 — Profile Editor (drawer or modal)

Two modes:
1. **Create** (no profile yet): fields default sensibly (`salary_type: 'monthly_fixed'`, `overtime_multiplier: 1.5`, `effective_from: today`, `currency: user.currency ?? company.currency`).
2. **Update**: pre-fill from the current active profile. Warn if the user is about to modify a historical profile.

Client-side validation (mirror the backend):
- `salary_type === 'monthly_fixed'` → `monthly_salary > 0`, hide `hourly_rate` field.
- `salary_type === 'hourly'` → `hourly_rate > 0`, hide `monthly_salary` and `is_deduct_salary` fields.
- `overtime_multiplier` ∈ [1, 10].
- `effective_to == null || effective_to >= effective_from`.

"Save as new active profile" checkbox for updates — when checked, close the current active profile (`PUT` with `effective_to = today`) then `POST` a new profile with `effective_from = tomorrow`. This is the recommended flow for a mid-cycle raise.

### Step 6 — Generate Payroll screen (`/payroll/generate`)

Simple form:
- Month picker (default: previous month)
- Year picker (default: current year)
- Notes textarea (optional)
- Big "Generate Payroll" button.

Before submit, call `PayrollApi.listRuns({ year, month })`:
- If a run already exists and its status is `approved` / `paid` → disable Generate, show "Locked" state.
- If it exists in `draft` / `generated` → show inline notice: "A run for this period already exists. Regenerating will replace it." Submit sets `force: true`.

Loading UI: full-panel spinner with the message "Calculating salaries for X employees..." — replace X with the number of active employees from your users cache, or leave generic.

On success: toast → redirect to `/payroll/runs/:id`.

On skipped users (`data.failed > 0`), render a persistent banner on the runs-detail page: "N employees skipped due to missing payroll profile. [Configure now →]".

### Step 7 — Payroll Runs list (`/payroll/runs`)

Filters: Year, Month, Status. Default view: current year.

Table columns:
- Period (e.g. "July 2026")
- Status (colored badge — grey/blue/green/purple for draft/generated/approved/paid)
- Employees (X of Y)
- Total gross (currency-formatted)
- Total net
- Generated by (name + relative time)
- Approved by (name + relative time, or "—")
- Actions: **View**, **Export CSV**

Sort: newest first (already server-sorted).

### Step 8 — Payroll Run Detail (`/payroll/runs/:runId`)

Sections:
1. **Summary header** — Period / status badge / totals / currency / notes.
2. **Actions bar** — status-aware buttons as described in §3.7. Include "Regenerate" that pre-fills the Generate screen with this period + `force: true`.
3. **Employees table** — with the search box wired to `?search=`. Include pagination controls.
4. **Row expansion** — pretty-JSON view of `calculation_snapshot` so HR can debug any specific salary calculation ("Why did John's deduction come out to 500?").
5. **Approve modal** — required confirmation, optional notes textarea, uses `useApproveRun`.

Refetch after approve; disable action buttons while mutations are in flight.

### Step 9 — My Payslips (`/payroll/my-payslips`)

Employee-facing view. Layout:
- Year filter (default: current year).
- Grid or list of cards, one per month: month name, final salary, status badge, "View breakdown" CTA.
- Card expansion or modal shows the full `calculation_snapshot` in a readable, non-JSON layout:
  - Salary type
  - Target vs worked / leave / holiday / overtime
  - Rate breakdown
  - Deduction (if applicable) with a one-line explanation
  - Final amount, currency-formatted, large

Only `status === 'approved' || 'paid'` rows should be shown to end employees (draft/generated may be in-progress and confusing). Filter client-side.

### Step 10 — Formatters

Two shared utilities keep the UI consistent with the backend semantics:

```ts
// hours: 158.5 → "158h 30m"
export const formatHours = (hours: number) => {
  if (!hours || hours <= 0) return '0h 0m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

// money: 27882.35, "BDT" → "৳ 27,882.35"
export const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
```

---

## 5. Edge cases you must handle in the UI

| Scenario                                       | Backend behavior                                                | UI action                                                                                                    |
|------------------------------------------------|-----------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Employee has no payroll profile                | Skipped during generation (`reason: 'no_active_payroll_profile'`) | Show banner on run detail; "Configure" CTA links to profile editor                                            |
| Employee joined mid-month                      | Backend pro-rates scheduled work days by `created_at`           | No UI action; snapshot shows scheduled_work_days trimmed                                                     |
| Employee deactivated mid-period                | Backend caps at `last_deactivate`                               | Show a small "left on YYYY-MM-DD" badge next to their row                                                    |
| Two admins generate the same period at once    | pg_advisory_xact_lock — second call waits, then errors          | Show generic error toast; the successful run will appear on refetch                                          |
| Regenerating an approved run                   | `400` with the "Historical runs cannot be regenerated" message  | Hide the button when `status === 'approved' \|\| 'paid'`                                                     |
| Editing a profile referenced by an approved run| `400 "Cannot modify a historical profile..."`                   | Detect this specific message and prompt the user to create a new profile instead                             |
| Slow generation (10-30s for large tenants)     | Sync response                                                   | Full-screen loader with informative copy; 60s client timeout                                                 |
| CSV export for a huge run                      | Sync response, plain CSV                                        | Use blob download flow (§3.9); disable button while download in flight                                       |

---

## 6. Error handling — recommended shape

```ts
try {
  const res = await PayrollApi.generate({ month, year, force });
  toast.success(res.data.message);
  navigate(`/payroll/runs/${res.data.data.payroll_run_id}`);
} catch (err) {
  const apiError = err.response?.data;
  if (apiError?.statusCode === 400 && apiError.message?.includes('already exists')) {
    // ask to force
    if (await confirm('Regenerate existing draft?')) {
      return retry({ force: true });
    }
  }
  toast.error(apiError?.message ?? 'Failed to generate payroll');
}
```

**Never** show raw stack traces. **Always** fall back to `apiError?.message` (which is always present in this codebase's envelope) before your generic fallback text.

---

## 7. Permissions matrix (single source of truth)

| Endpoint                         | admin | hr  | manager | employee | project_manager |
|----------------------------------|:-----:|:---:|:-------:|:--------:|:---------------:|
| POST /payroll/profile            | ✅    | ✅  | ❌      | ❌       | ❌              |
| GET  /payroll/profile            | ✅    | ✅  | ❌      | ❌       | ❌              |
| GET  /payroll/profile/:userId    | ✅    | ✅  | own only| own only | own only        |
| PUT  /payroll/profile/:id        | ✅    | ✅  | ❌      | ❌       | ❌              |
| POST /payroll/generate           | ✅    | ✅  | ❌      | ❌       | ❌              |
| GET  /payroll/runs               | ✅    | ✅  | ❌      | ❌       | ❌              |
| GET  /payroll/run/:id            | ✅    | ✅  | ❌      | ❌       | ❌              |
| PATCH /payroll/run/:id/approve   | ✅    | ✅  | ❌      | ❌       | ❌              |
| GET  /payroll/run/:id/export     | ✅    | ✅  | ❌      | ❌       | ❌              |
| GET  /payroll/history            | any user | any user | own only | own only | own only  |

---

## 8. Sample cURL requests (copy into Postman/Bruno)

```bash
# create profile
curl -X POST https://api.example.com/api/v1/payroll/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 42,
    "salary_type": "monthly_fixed",
    "monthly_salary": 30000,
    "overtime_allow": true,
    "overtime_multiplier": 1.5,
    "is_deduct_salary": true,
    "target_hours_month": 170,
    "effective_from": "2026-07-01",
    "currency": "BDT"
  }'

# generate
curl -X POST https://api.example.com/api/v1/payroll/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "month": 7, "year": 2026, "force": false }'

# approve
curl -X PATCH https://api.example.com/api/v1/payroll/run/87/approve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "notes": "Reviewed and approved by finance" }'

# export CSV
curl -OJ -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/v1/payroll/run/87/export

# my payslips (any authenticated user)
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.example.com/api/v1/payroll/history?year=2026"
```

---

## 9. Definition of done (for the client agent)

- [ ] All types added under `src/types/payroll.ts`
- [ ] API client wrapper in `src/api/payroll.ts` with typed methods for all 10 endpoints
- [ ] React Query (or equivalent) hooks with proper cache invalidation
- [ ] Role-gated nav item; route guards for admin/hr routes
- [ ] Payroll Settings screen with paginated table + "not configured" tab
- [ ] Profile editor with client-side validation matching backend rules
- [ ] Generate Payroll screen with pre-flight duplicate check + `force` confirm modal
- [ ] Payroll Runs list with year/month/status filters
- [ ] Payroll Run Detail with actions bar, employee table, CSV export, expandable snapshot rows
- [ ] Approve modal with mandatory confirm + notes
- [ ] My Payslips screen (employee view) showing only approved/paid runs
- [ ] Formatters for hours and money using the item's currency
- [ ] Graceful handling of all documented error messages
- [ ] Manual QA against the four spec examples:
  - `monthly_fixed`, deduct, 150h worked, 8h leave, target 170 → `final_salary ≈ 27882.26 BDT`
  - `monthly_fixed`, no deduct, same → `final_salary = 30000`
  - `monthly_fixed`, overtime, 180h worked → `final_salary ≈ 32647.05`
  - `hourly` at 200/hr × 150h → `final_salary = 30000`

Ship it.
