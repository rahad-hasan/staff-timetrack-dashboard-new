# Payroll Dashboard — Change Request (v4)

> Delta for the dashboard agent.
> Fixes the payroll members list showing **90** ("Members loaded") vs the
> real active headcount of **75** shown on the main dashboard. Inactive /
> deleted users must not appear in payroll setup.

---

## 1. The bug you're seeing

On the Payroll Settings page the header cards showed:

| Card              | Value | Correct? |
|-------------------|-------|----------|
| Total Profiles    | 5     | ✔        |
| Active Profiles   | 5     | ✔        |
| Not Configured    | 85    | ✘ (should be 70) |
| Members Loaded    | 90    | ✘ (should be 75, the active headcount) |

Root cause: the dashboard is computing "Members Loaded" and "Not Configured" from a **generic users endpoint** that returns every user in the tenant — active, inactive, and deactivated. Payroll setup only makes sense for currently-active employees.

---

## 2. What the backend now provides

Two new endpoints, plus one behavior change on the existing profile list. All scoped to `admin` + `hr` roles and behind `checkSubscriptionValidity`, same as the rest of the payroll module.

### 2.1 `GET /payroll/summary` — header-card counters

Zero-parameter, single-shot response for the four header cards. Fast (3 parallel COUNTs).

Response `200`:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Payroll summary retrieved",
  "data": {
    "total_active_employees": 75,
    "with_active_profile": 5,
    "without_active_profile": 70,
    "with_schedule": 60,
    "without_schedule": 15
  }
}
```

Field definitions — every count is scoped to `is_active = true` AND `is_deleted = false`:

| Field                     | Meaning                                                              |
|---------------------------|----------------------------------------------------------------------|
| `total_active_employees`  | Active employees in the tenant (should match "Team members" card)    |
| `with_active_profile`     | Of those, how many already have an active `EmployeePayrollProfile`   |
| `without_active_profile`  | The "Not configured" number — `total - with_active_profile`          |
| `with_schedule`           | Of active employees, how many have at least one `ScheduleAssign`     |
| `without_schedule`        | `total - with_schedule` — good candidates for the "Assign schedule" nudge |

### 2.2 `GET /payroll/eligible-users` — paginated setup list

Returns only **active, non-deleted** users, each annotated with `has_profile` and `has_schedule`. Replace any generic `/users` call you were using on the Payroll Settings screen with this.

Query params (all optional):
- `search: string` — name or email, case-insensitive contains
- `has_profile: boolean` — filter to only users with (or without) an active payroll profile
- `has_schedule: boolean` — filter to only users with (or without) a schedule
- `page: number` — default `1`
- `limit: number` — default `25`, max `200`

Response `200`:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Eligible users retrieved",
  "data": [
    {
      "id": 42,
      "name": "Tanvir Ahmed Emon",
      "email": "tanviremon726@gmail.com",
      "image": null,
      "role": "employee",
      "currency": "BDT",
      "created_at": "2026-01-14T04:22:11.000Z",
      "status": "permanent",
      "has_profile": true,
      "has_schedule": true
    },
    {
      "id": 88,
      "name": "New Joiner",
      "email": "new.joiner@example.com",
      "image": null,
      "role": "employee",
      "currency": "BDT",
      "created_at": "2026-07-10T09:15:00.000Z",
      "status": "probation",
      "has_profile": false,
      "has_schedule": false
    }
  ],
  "meta": { "page": 1, "limit": 25, "total": 75, "totalPages": 3 }
}
```

Common filter combos the UI will need:
- Setup queue: `?has_profile=false` — everyone who still needs a payroll profile
- Full active roster: no filters
- Needs schedule too: `?has_profile=false&has_schedule=false`

### 2.3 `GET /payroll/profile` — inactive users now excluded by default

The existing list endpoint now defaults to hiding profiles that belong to deactivated / soft-deleted users. To restore the old audit-view behavior, pass `?include_inactive_users=true`. Everything else is unchanged.

```
GET /payroll/profile                              → active users' profiles only  (NEW default)
GET /payroll/profile?include_inactive_users=true  → include historical profiles for offboarded users
```

Practical impact: your `TOTAL PROFILES` card, which was already showing `5`, stays at `5` (nobody with a profile was inactive). If any deactivated employee had a profile in the past, they'll now be hidden by default. Add an "Include offboarded" toggle if HR wants the historical view.

---

## 3. What to change on the dashboard

### 3.1 Header cards — replace with a single `/summary` call

**Before (fragile — mixes payroll data with generic users):**
```ts
const profiles = await PayrollApi.listProfiles({ limit: 1 });      // meta.total = 5
const users    = await UsersApi.list({ limit: 1 });                // meta.total = 90 ✘
const notConfigured = users.meta.total - profiles.meta.total;      // 85 ✘
```

**After (single source of truth):**
```ts
const summary = await PayrollApi.summary();
// summary.data:
//   total_active_employees, with_active_profile, without_active_profile,
//   with_schedule, without_schedule
```

Then bind the cards directly:

| Card              | Source                                     |
|-------------------|--------------------------------------------|
| Total Profiles    | `summary.with_active_profile`              |
| Active Profiles   | `summary.with_active_profile`              |
| Not Configured    | `summary.without_active_profile`           |
| Members Loaded    | `summary.total_active_employees`           |

(Total Profiles and Active Profiles are the same value now — you can either keep both cards, drop one, or repurpose the second to "Without Schedule": `summary.without_schedule`.)

### 3.2 "Not configured" tab / setup list — use `/eligible-users`

**Before:**
```ts
const users = await UsersApi.list({ limit: 100 });                 // includes inactive ✘
const profiles = await PayrollApi.listProfiles({ limit: 1000 });
const withProfile = new Set(profiles.data.map(p => p.user_id));
const notConfigured = users.data.filter(u => !withProfile.has(u.id)); // wrong count
```

**After:**
```ts
const list = await PayrollApi.eligibleUsers({ has_profile: false, page, limit });
// list.data — each item already has has_profile: false, has_schedule: bool
// list.meta.total — accurate count for pagination
```

### 3.3 Add API client wrappers

```ts
// src/api/payroll.ts
export const PayrollApi = {
  // ... existing methods
  summary: () =>
    api.get<ApiResponse<PayrollSummary>>('/payroll/summary'),
  eligibleUsers: (params: EligibleUsersParams) =>
    api.get<ApiResponse<EligibleUser[]>>('/payroll/eligible-users', { params }),
};
```

### 3.4 TypeScript types to add

```ts
export interface PayrollSummary {
  total_active_employees: number;
  with_active_profile: number;
  without_active_profile: number;
  with_schedule: number;
  without_schedule: number;
}

export interface EligibleUser {
  id: number;
  name: string;
  email: string;
  image: string | null;
  role: string;                    // 'employee' | 'manager' | 'hr' | 'admin' | ...
  currency: string | null;
  created_at: string;              // ISO datetime
  status: 'probation' | 'permanent';
  has_profile: boolean;
  has_schedule: boolean;
}

export type EligibleUsersParams = {
  search?: string;
  has_profile?: boolean;
  has_schedule?: boolean;
  page?: number;
  limit?: number;
};
```

### 3.5 React Query hook shape

```ts
export const usePayrollSummary = () =>
  useQuery({
    queryKey: ['payroll', 'summary'],
    queryFn: () => PayrollApi.summary().then((r) => r.data),
    staleTime: 30_000,
  });

export const useEligibleUsers = (params: EligibleUsersParams) =>
  useQuery({
    queryKey: ['payroll', 'eligible-users', params],
    queryFn: () => PayrollApi.eligibleUsers(params).then((r) => r.data),
    staleTime: 15_000,
  });
```

Remember to invalidate both after any profile mutation:

```ts
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ['payroll', 'summary'] });
  qc.invalidateQueries({ queryKey: ['payroll', 'eligible-users'] });
  qc.invalidateQueries({ queryKey: ['payroll', 'profiles'] });
}
```

---

## 4. Guarantees

- All three endpoints are scoped to `admin` + `hr` roles.
- Everything is tenant-scoped through `req.user.company_id` — no cross-tenant leakage.
- `is_active` and `is_deleted` filters use the same predicates the rest of the app uses for user listing, so counts match the main dashboard's "Team members" card exactly.
- `/summary` runs three parallel COUNTs, no full table scan — safe to call on every page load.
- `/eligible-users` batches the `has_profile` / `has_schedule` lookups into two queries regardless of page size — O(1) queries per request.

---

## 5. Verification checklist

- [ ] Payroll Settings header cards now match the main dashboard's "Team members" number (75, not 90)
- [ ] The "Not Configured" tab count matches `summary.without_active_profile`
- [ ] Deactivating a user in the admin panel then refetching the summary reduces `total_active_employees` by 1
- [ ] Assigning a schedule to a currently-warned user then refetching eligible-users flips `has_schedule` to `true`
- [ ] Setting `?include_inactive_users=true` on `/payroll/profile` brings back any offboarded-user profiles (for audit)
- [ ] Network tab shows only `/payroll/summary` and `/payroll/eligible-users` calls on the Payroll Settings page (no more `/users` or `/company/users` for this screen)

---

## 6. Rollout

Backend deployed. Ship the dashboard change any time — all new fields and endpoints are additive.
