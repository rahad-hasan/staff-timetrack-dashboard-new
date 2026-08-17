# Admin Dashboard — Billing, Plans & Seats Implementation Guide

> Instructions for the AI agent (or developer) implementing the **company admin dashboard**
> billing experience: plan purchase, upgrade/downgrade, mid-cycle seat additions with proration,
> payment-failure recovery, trial lifecycle, and cancellation.
> Every endpoint, payload, and message below matches the backend code exactly.

---

## 0. Ground rules

- **Base URL:** `/api/v1/packages/*` unless noted. Auth: `Authorization: Bearer <token>` or the
  `accessToken` cookie.
- **Roles:** all billing **mutations** require the company `admin`. `GET /billing/status` and
  `GET /billing/invoices` are also readable by `manager` / `hr`.
- **Success envelope:** `{ statusCode, data, message, meta?, success: true }`.
  **Error envelope:** `{ success: false, message, errorMessages: [{ path, message }] }` —
  validation errors are `400` with the first issue as `message`; bodies are strict
  (`400 "Your request contains unsupported fields"` on unknown keys).
- **Money:** all Stripe-derived amounts are **integer cents** (`amount_due_cents: 7068` = $70.68).
  Plan seat prices (`seat_price_monthly` etc.) are dollars.

---

## 1. The billing state machine (drives the whole UI)

Fetch once on dashboard load and after every billing action:

### `GET /packages/billing/status`

```jsonc
{
  "entitlements": {
    "status": "active",              // see table below (null = no subscription)
    "plan_id": 3, "plan_name": "Elite", "tier": "pro",
    "billing_cycle": "yearly",
    "seat_limit": 25,                // purchased seats; -1 = unlimited (trial/free)
    "limits": { "max_seats": -1, "max_projects": 20, "...": "…" },
    "trial_ends_at": "2026-08-24T…", // null unless trialing
    "current_period_end": "2027-02-01T…",
    "pending_downgrade_plan_id": null,
    "url_tracking": true
  },
  "blocked": false,
  "block": null,                     // when blocked: { error, code, message, actionRequired, webBillingUrl }
  "latest_unpaid_invoice": null      // set during past_due / payment_failed — see §4
}
```

| `entitlements.status` | UI treatment |
|---|---|
| `trialing` | Trial banner with countdown to `trial_ends_at` + "Choose a plan" CTA (§2). If `trial_ends_at` has passed, treat as blocked (worker resolves within the hour). |
| `active` | Normal operation. Show plan card, seats, renewal date (`current_period_end`). |
| `past_due` / `payment_failed` | **Payment-failure mode** (§4): red banner, "Pay now" button, dashboard is read-only (writes return 402). |
| `pending_downgrade_selection` | Force the **downgrade selection flow** (§6) — block normal navigation with a full-screen takeover; everything else is 402-blocked anyway. |
| `canceled` | "Subscription ended" screen + pricing page CTA (new checkout is allowed again). |
| `null` (no subscription) | Legacy company — show pricing page CTA. |

`block.code` values you may receive on gated endpoints:
`SUBSCRIPTION_PAST_DUE`, `TRIAL_EXPIRED`, `SELECTION_REQUIRED`, `SUBSCRIPTION_CANCELED`,
`SUBSCRIPTION_REQUIRED`, `SUBSCRIPTION_EXPIRED`, `COMPANY_DEACTIVATED`. Map each to a friendly
screen; `webBillingUrl` (`/settings/billing`) is where every one of them should link.

**Global interceptor requirement:** any API response with HTTP `402` anywhere in the app must
redirect/banner to the billing page with the payload's `message`. During payment failure the
backend allows `GET` requests (dashboard stays browsable) and blocks writes with 402.

---

## 2. Pricing page & first purchase (checkout)

1. `GET /packages` (public) — active plans. A plan has ONE price per billing cycle
   (`monthly` | `quarterly` | `yearly`), each **per seat** and each exactly what Stripe charges.
   Read the derived `cycle_pricing[cycle]` rather than the raw prices:
   - headline `cycle_pricing[cycle].monthly_equivalent` with the caption "per user / month", so
     every cycle is directly comparable;
   - underneath, "billed `seat_price` per user / month|quarter|year" so the amount that will
     actually be invoiced is always on screen (monthly can just say "billed monthly per user");
   - a "Save `savings_percent`%" chip when that field is non-null. Savings are measured against
     paying monthly for the same span, so the chip never appears on the monthly cycle and never
     appears when monthly is not sold.
   - `description` as the tagline under the plan name ("Best for growing teams"). It is
     `string | null` — collapse the element when null rather than substituting the tier name.
   - `badge_text` ribbon, and `features` as the bullet list. Each bullet is
     `{ label, note, note_source, limit_key, included }`:
     - render `note` as an ⓘ tooltip when non-null ("Up to 1 month history"). It is derived
       server-side when `note_source === "limit"` (default phrase, or admin wording with the
       limit's live value interpolated) — never recompute or cache it client-side;
     - `included: false` means the plan's limit switches that feature OFF (screenshots disabled,
       a cap of 0). Do **not** render those with a plain tick — strike through or use a muted
       icon, or the card claims a feature the plan does not have.
   - Build the cycle toggle from the union of every plan's `available_cycles`, and filter cards
     by the same field. `cycle_pricing[cycle] === null` (equivalently, cycle absent from
     `available_cycles`) means that plan is not sold on that cycle — never render `$0.00` as an
     offer. An EMPTY `available_cycles` is the free/downgrade-target plan: keep it on the grid,
     but with a caption instead of a checkout CTA.

   `available_cycles` and `cycle_pricing` are derived server-side on every read — do not persist
   or recompute them client-side. There is no `billing_interval` field; it was removed because a
   single enum cannot express which subset of N cycles a plan sells.
2. Optional promo code: validate against `GET /packages/discount/list?plan=<id>` or just submit it.
3. Purchase:

   ### `POST /packages/payment/url`
   ```json
   { "plan_id": 3, "seats": 25, "cycle": "yearly", "discount_code": "WELCOME20" }
   ```
   → `data: { "checkoutUrl": "https://checkout.stripe.com/…", "trialWillEndImmediately": true }`

   Redirect the browser to `checkoutUrl` (Stripe-hosted checkout). Stripe returns to
   `/billing/success?session_id=…` or `/billing/cancel` — implement both pages; on success,
   poll `GET /packages/billing/status` until `status === "active"` (webhook-driven, usually < 5 s).

   - If `trialWillEndImmediately` is true, warn first: *"Your trial ends now and paid billing
     starts immediately."*
   - `seats` must be ≥ current active users → `400 "Requested seats are below the current active
     user count"`-style message; surface it inline.
   - A company with a non-canceled Stripe subscription gets
     `400 "A Stripe subscription already exists…"` — route them to **switch-plan** (§5) or
     **add-seats** (§3) instead. Hide the checkout CTA when `stripe_subscription_id` billing is
     already active (i.e. status `active` with a paid plan).

**Discount behavior (important for copy):** percentage promo codes apply to the **entire first
billing cycle** — including prorated mid-cycle seat additions (§3). Fixed-amount codes apply to
the first invoice only. Renewals are full price.

---

## 3. Seats: usage, adding users, and mid-cycle proration

### Seat usage display

From `billing/status`: purchased seats = `entitlements.seat_limit` (−1 ⇒ show "Unlimited"),
plan ceiling = `entitlements.limits.max_seats` (−1 ⇒ unlimited). Effective cap = the stricter of
the two. Show "18 of 25 seats used" with a progress bar (active-user count comes from your
existing members list).

### When employee creation hits the cap

`POST /api/v1/auth/employees` returns `400 "Upgrade your plan to add more seats."` —
catch **exactly this message** and open the **Add seats** dialog instead of showing a raw error.
(Project creation similarly returns `400 "Your plan allows up to N active project(s)…"` → prompt
plan upgrade.)

### Add seats — ALWAYS two steps: quote first, then confirm

**Step 1 — preview (read-only, no charge):**

### `POST /packages/subscription/seat-quote`
```json
{ "seats": 2 }
```
```jsonc
// data:
{
  "seats_before": 25, "seats_after": 27, "seats_added": 2,
  "amount_due_cents": 5655, "currency": "usd",
  "current_period_start": "2027-02-01T…", "current_period_end": "2027-02-01T…",
  "lines": [
    { "amount_cents": 7068, "description": "Remaining time on 27 × Elite…", "is_proration": true, "period_start": "2026-07-14T…", "period_end": "2027-02-01T…" },
    { "amount_cents": -1413, "description": "20% off", "is_proration": true, "...": "…" }
  ]
}
```

Render a confirmation modal: *"Adding **2 users** costs **$56.55** now, covering
**Jul 14 → Feb 1** (the rest of your current billing period). Your renewal on Feb 1 will include
all 27 users."* List `lines` as the breakdown (negative amounts are discounts/credits).

**Step 2 — confirm:**

### `PATCH /packages/subscription/add-seats`
```json
{ "seats": 2 }
```
```jsonc
// data:
{
  "quote": { "...same shape as above..." },
  "latest_invoice_status": "paid",          // or "open"
  "hosted_invoice_url": "https://invoice.stripe.com/…",
  "payment_intent_client_secret": "pi_…_secret_…",
  "payment_intent_status": "succeeded",
  "pending_update": false,
  "company_subscription": { "...": "…" }
}
```

Handle three outcomes:

| Outcome | Detect | UI |
|---|---|---|
| Paid instantly (card on file charged) | `pending_update: false` and `latest_invoice_status: "paid"` (or amount 0) | "2 seats added ✓" — seat limit is live immediately. |
| Payment action needed | `pending_update: true` / invoice `open` | "Almost done — confirm payment" → open `hosted_invoice_url` in a new tab (simplest), or confirm `payment_intent_client_secret` with Stripe.js. Seats apply automatically once paid (webhook); poll `billing/status`. |
| Blocked | `400` with message | Show message. Blocked while `canceled` / `past_due` / `payment_failed` / `pending_downgrade_selection`, or without a paid Stripe subscription. |

### The proration corner case, end to end (what the backend guarantees)

> Admin bought **25 seats, yearly, in February**. In **July** they add **2 users**.

- Stripe charges the 2 extra seats **only for July → next February** (remaining period),
  computed to the day (`always_invoice` proration). The quote endpoint shows the exact number
  before they commit.
- If the subscription carries a **percentage discount** (promo code at checkout), Stripe applies
  it to the proration invoice automatically — the 2 seats are discounted **proportionally**, same
  rate as the original purchase.
- The **renewal anchor never moves**: next February they're billed for 27 seats for the full year.
- The frontend never computes any of this — always display the server quote.

---

## 4. Payment failure → pay the bill → auto-recovery

When Stripe payment fails (`status` becomes `past_due` or `payment_failed`):

1. Full-width red banner on every page: use `block.message` from `billing/status`. Desktop
   tracking for the whole company is paused (the tracker apps get 402) — say so:
   *"Time tracking is paused for your team until the invoice is settled."*
2. `latest_unpaid_invoice` from `billing/status` powers the **Pay now** card:

   ```jsonc
   {
     "invoice_number": "SUB-2026-000123", "status": "failed",
     "total_cents": 168000, "amount_due_cents": 168000, "currency": "usd",
     "period_start": "…", "period_end": "…",
     "hosted_invoice_url": "https://invoice.stripe.com/…",  // ← "Pay now" opens this
     "invoice_pdf": "https://…/pdf"
   }
   ```

   **Pay now → open `hosted_invoice_url`** (Stripe-hosted payment page, handles 3-D Secure,
   updates the default card). No custom payment form needed.
3. After payment, Stripe's webhook restores `status: "active"` within seconds and desktop
   tracking resumes automatically (no restarts). Poll `billing/status` every ~5 s while the
   banner is up; clear it when `blocked` flips false. Show
   `entitlements`-level `last_payment_failure_reason` if you want detail text.
4. **Invoice history page:** `GET /packages/billing/invoices?page=1&limit=10` → rows in the shape
   above (+ `paid_at`, `billing_reason`, `created_at`), `meta` pagination. Status chips:
   `paid` green, `pending`/`unpaid` orange, `failed` red, `refunded` gray. Every row links
   `hosted_invoice_url` / `invoice_pdf` when present.

---

## 5. Upgrade / downgrade (plan switch), prorated

### `PATCH /packages/subscription/switch-plan`
```json
{ "planId": 4, "seats": 27, "cycle": "yearly" }
```
- `seats` optional (keeps current quantity); `cycle` optional (keeps current cycle).
- Prorated mid-cycle by Stripe: **upgrades** charge the price difference for the remaining
  period immediately; **downgrades** credit the unused difference. Switching `monthly` ↔
  `yearly` restarts the billing cycle from today (tell the user!).
- Response mirrors add-seats, plus:
  `data.switched_to: { plan_id, plan_name, cycle }` and `data.applied_now: boolean`.
  `applied_now: false` → same "confirm payment" handling as §3 (message:
  `"Plan switch pending payment. Settle the proration invoice to apply the change."`).
- Errors to surface inline: already on that plan+cycle; seats below active users; seats above
  the target plan's `max_seats` (`"The <plan> plan allows up to N seat(s)…"`); blocked statuses
  (same as add-seats); no Stripe subscription → route to checkout instead.
- After an upgrade succeeds, if the company previously had parked users/projects, offer
  **"Restore parked users & projects"** → `POST /packages/downgrade/restore` (§6).

UI: on the pricing page, when a paid subscription is active, plan cards show **"Switch to this
plan"** (calling this endpoint with a confirmation modal) instead of the checkout button.

---

## 6. Trial lifecycle & over-limit downgrade selection

- **New companies start on a reverse trial automatically** (top-tier plan, no card). Show the
  trial banner from `status: "trialing"` + `trial_ends_at`. There is no "start trial" button to
  build (the legacy `POST /packages/plan/start-trial` will refuse — trial already used).
- At expiry the backend auto-downgrades to the Free plan **if the account fits its limits**.
  If it's over (e.g. 25 users, Free allows 10) the status becomes `pending_downgrade_selection`
  and the owner must choose what stays:

### `GET /packages/downgrade/preview`
```jsonc
{
  "target_plan": { "id": 1, "name": "Starter", "tier": "standard", "limits": { "max_seats": 10, "max_projects": 3, "...": "…" } },
  "needs_user_selection": true, "max_seats": 10,
  "needs_project_selection": true, "max_projects": 3,
  "active_users": [{ "id": 7, "name": "…", "email": "…", "role": "admin", "created_at": "…" }],
  "active_projects": [{ "id": 12, "name": "…", "status": "processing", "start_date": "…", "deadline": "…" }]
}
```

Build a two-step wizard (only the steps whose `needs_*` flag is true): checkbox lists with a
live counter ("8 of 10 selected"). **The acting admin's own account is always kept and doesn't
consume a click** — preselect and lock it. Then:

### `POST /packages/downgrade/resolve`
```json
{ "keep_user_ids": [7, 8, 9], "keep_project_ids": [12, 13, 14] }
```
→ `data: { "subscription": …, "parked_users": 15, "archived_projects": 7 }`

Confirmation copy must be reassuring and truthful: *"15 members will be deactivated and 7
projects archived. **Nothing is deleted** — all their history stays, and upgrading later lets
you restore them with one click."* Parked members can't sign in; archived projects accept no new
time but remain in all reports.

- **Alternative CTA on the same screen:** "Keep everyone — upgrade instead" → pricing page
  (checkout, since trial subscriptions have no Stripe subscription yet).
- **After a later upgrade:** `POST /packages/downgrade/restore` →
  `{ restored_users, restored_projects, seat_cap, project_cap, still_parked_users, still_parked_projects }`.
  Show what came back and what's still parked (restores oldest-parked first, up to the new caps).

---

## 7. Cancel — anytime

### `DELETE /packages/subscription/cancel`
```json
{ "at_period_end": true, "reason": "Too expensive" }
```
- Default (`at_period_end: true`): service continues until `current_period_end`, then ends.
  Copy: *"Your plan stays active until Feb 1. No further charges."*
- `at_period_end: false`: immediate cancellation — tracking stops for the whole team right away.
  Require a typed confirmation for this one.
- `reason` (≤ 300 chars) — optional dropdown + free text; it's stored for churn analytics.
- Message: `"Subscription cancellation requested"`. After period end, `status` becomes
  `canceled` → show the ended screen (§1). A canceled company can purchase again via checkout.

---

## 8. Acceptance checklist

- [ ] `billing/status` fetched on load + after every billing action; global 402 interceptor → billing page
- [ ] All six statuses render distinct, correct screens (incl. `pending_downgrade_selection` takeover)
- [ ] Checkout flow with promo code, success/cancel pages, post-checkout polling
- [ ] Seat cap error `"Upgrade your plan to add more seats."` opens the add-seats dialog
- [ ] Add-seats is **quote → confirm**; quote lines rendered; the three payment outcomes handled
- [ ] `hosted_invoice_url` used for both failed-invoice payment and pending proration invoices
- [ ] Plan switch cards on pricing page when subscription active; cycle-change warning; restore offer after upgrade
- [ ] Payment-failure banner with team-wide tracking-paused notice; auto-clears on recovery
- [ ] Invoice history table with status chips + PDF links
- [ ] Downgrade wizard: needs-flags respected, self locked-in, honest "nothing is deleted" copy
- [ ] Cancel: period-end default, immediate requires typed confirmation
- [ ] All amounts displayed from server cents — the frontend never computes proration
