# Invoice history & invoice document — frontend integration guide

Audience: whoever owns `/settings/billing`.
Backend status: implemented, on branch `package` (2026-08-13).
Related: [`stripe-local-webhooks.md`](./stripe-local-webhooks.md) for the backend/runbook side.

---

## 1. TL;DR — what you actually have to do

| #   | Change                                                                                                    | Effort        |
| --- | --------------------------------------------------------------------------------------------------------- | ------------- |
| 1   | Nothing, to fix "No invoices yet" — the list endpoint now self-heals. Just re-test.                       | none          |
| 2   | Consume 3 new fields on the existing list rows: `voided`, `detail_path`, and corrected `amount_*` values. | small         |
| 3   | Build the invoice document view + **client-side PDF export** from the new detail endpoint.                | the real work |

The backend deliberately does **not** generate PDFs. It returns every value the
document needs; rendering and "Download PDF" happen in the browser.

---

## 2. Endpoint 1 — invoice list (existing, changed)

```
GET /api/v1/packages/billing/invoices?page=1&limit=10
Auth: admin | manager | hr
```

Response is the standard envelope:

```jsonc
{
  "success": true,
  "statusCode": 200,
  "message": "Invoices retrieved successfully",
  "data": [
    /* rows below */
  ],
  "meta": { "page": 1, "limit": 10, "total": 37, "totalPages": 4 },
}
```

Each row:

```jsonc
{
  "id": 412,
  "invoice_number": "A1B2C3D4-0001",
  "status": "paid", // paid | unpaid | pending | failed | refunded
  "currency": "usd", // lowercase ISO — uppercase it for Intl
  "total_cents": 2000,
  "amount_paid_cents": 2000,
  "amount_due_cents": 0,
  "voided": false, // NEW
  "period_start": "2026-08-01T00:00:00.000Z",
  "period_end": "2026-09-01T00:00:00.000Z",
  "paid_at": "2026-08-01T00:05:12.000Z",
  "created_at": "2026-08-01T00:00:00.000Z",
  "hosted_invoice_url": "https://invoice.stripe.com/...", // may be null
  "invoice_pdf": "https://pay.stripe.com/invoice/.../pdf", // may be null
  "billing_reason": "subscription_cycle",
  "detail_path": "/api/v1/packages/billing/invoices/412", // NEW
}
```

### What changed and why you care

- **`voided` (new).** A voided invoice is not owed. Render it as `Voided` and
  suppress any "Pay now" affordance. Note `status` for a voided invoice is
  `refunded` (Stripe maps `void` → our `refunded`), so **do not** use `status`
  alone to decide the badge — check `voided` first.
- **`amount_due_cents` / `amount_paid_cents` are now derived, not raw.** They
  used to read `0` for older rows that had null columns, and a voided invoice
  used to report its full original balance. Both are fixed server-side. If you
  had any client-side compensation for that, delete it.
- **`detail_path` (new).** Use it instead of building the URL yourself.

### First-load latency note

Page 1 may trigger a one-off Stripe reconciliation when history looks empty or
behind (this is the "No invoices yet" fix). That request can take a couple of
seconds; it is throttled to at most once per company per 10 minutes. Don't set
an aggressive client-side timeout on the billing page's first load, and keep a
skeleton/spinner rather than rendering an empty state immediately.

After checkout, `/billing/success` → `POST /packages/checkout/confirm` also
backfills the invoice, so navigating straight to billing should already show it.

---

## 3. Endpoint 2 — invoice detail (new)

```
GET /api/v1/packages/billing/invoices/:id
Auth: admin | manager | hr   (tenant-scoped: another company's id returns 404)
```

`data` is the list row **plus** everything below. The list-shaped money fields
and the `totals` block are computed by the same server helper, so they can
never disagree — use either, don't mix.

```jsonc
{
  // ...all list-row fields (id, invoice_number, status, currency, voided, ...)

  "date_of_issue": "2026-08-01T00:00:00.000Z", // print this, NOT created_at
  "date_due": "2026-08-01T00:00:00.000Z",
  "transaction_date": "2026-08-01T00:05:12.000Z", // null when unpaid
  "plan_name": "Starter",
  "lines_truncated": false,

  "seller": {
    "name": "Orbit Technology",
    "product_name": "n Tracker",
    "address_lines": ["Uttara, Dhaka", "Dhaka 1215", "Bangladesh"],
    "phone": null,
    "support_email": "support@lead-academy.org",
  },

  "bill_to": {
    "name": "Acme Ltd",
    "company_id": 680171,
    "address": "Uttara, Dhaka 1215, Bangladesh", // nullable
    "email": "billing@acme.example", // nullable
  },

  "lines": [
    {
      "description": "2 × Starter (at $7.00 / month)", // nullable
      "quantity": 2, // nullable
      "unit_amount_cents": 700, // nullable
      "amount_cents": 1400,
      "currency": "usd",
      "period_start": 1785110400, // EPOCH SECONDS, not ISO
      "period_end": 1787788800,
      "proration": false,
    },
  ],

  "totals": {
    "subtotal_cents": 2000,
    "discount_cents": 0,
    "tax_cents": 0,
    "total_cents": 2000,
    "amount_paid_cents": 2000,
    "amount_remaining_cents": 0,
    "refunded_cents": 0,
  },
}
```

### Arithmetic contract

```
sum(lines[].amount_cents) === totals.subtotal_cents     // when lines_truncated === false
totals.total_cents === subtotal - discount + tax
```

Line amounts are **pre-discount and pre-tax** — that is Stripe's model, and the
totals ladder is what reconciles them. Render the ladder; never recompute the
total from the lines.

---

## 4. Rendering rules (please don't skip these)

**Money.** Every `*_cents` field is an integer in minor units. Divide by 100 at
the render boundary only:

```ts
const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
```

**Dates.** Top-level dates are ISO strings. **`lines[].period_start/_end` are
epoch seconds** — `new Date(sec * 1000)`. This asymmetry is deliberate (the line
periods come straight from Stripe); just don't feed seconds to `new Date()`.

**Proration lines.** On a proration line, `quantity × unit_amount_cents` will
**not** equal `amount_cents` (and `amount_cents` can be negative — a credit).
Always print `amount_cents` for the line total. Consider tagging the row
"Proration" when `proration === true`.

**`lines_truncated === true`.** Stripe holds more lines than we snapshot (cap:
20). The lines shown will sum to _less_ than `subtotal_cents`. Do not present it
as a complete itemisation — show a note like "Showing first 20 of N items — see
full invoice" and link `hosted_invoice_url`. Rare, but it happens on invoices
with many mid-cycle seat changes.

**Refunds.** `totals.refunded_cents > 0` means money went back. Stripe still
reports the invoice as fully paid, so without an explicit refund row the
document reads as a normal paid invoice. Print a "Refunded" line.

**Voided.** `voided === true` → `amount_remaining_cents` is `0`. Badge it
`Voided`; do not show a balance.

**Nullables.** `bill_to.address`, `bill_to.email`, `seller.phone`,
`line.description`, `line.quantity`, `line.unit_amount_cents` can all be null.
Omit the row/segment rather than printing "null" or "—" in a money column.

**Unicode.** Company names may be in Bengali or any script. Whatever PDF library
you pick, verify it embeds a font covering both Latin and the target script —
this is exactly where the backend renderer was rejected (Noto Sans Bengali has
no Latin glyphs; the Latin text rendered as tofu boxes). Test with a Bengali
company name before shipping.

---

## 5. Document layout

Match the Hubstaff invoice structure, with our branding:

```
┌────────────────────────────────────────────────────────────┐
│  Invoice                          [logo] Staff Time Tracker│
│                                                            │
│  Invoice number   A1B2C3D4-0001                            │
│  Date of issue    Aug 1, 2026                              │
│  Date due         Aug 1, 2026                              │
│  Transaction date Aug 1, 2026        ← omit when null      │
│                                                            │
│  Orbit Technology              Bill to                     │
│  Uttara, Dhaka                 Acme Ltd (ID: 680171)       │
│  Dhaka 1215                    Uttara, Dhaka 1215, BD      │
│  Bangladesh                    billing@acme.example        │
│  support@lead-academy.org                                  │
│                                                            │
│  Description        Quantity   Unit price      Total       │
│  ────────────────────────────────────────────────────      │
│  2 × Starter              2       $7.00       $14.00       │
│  Aug 1 – Sep 1, 2026                                       │
│  More screenshots         2       $3.00        $6.00       │
│  Aug 1 – Sep 1, 2026                                       │
│                          ──────────────────────────        │
│                          Subtotal              $20.00      │
│                          Discount              -$5.00  ←only if > 0
│                          Total excluding tax   $15.00      │
│                          Tax                    $0.00      │
│                          Total                 $20.00      │
│                          Amount paid           $20.00      │
│                          Amount remaining       $0.00      │
└────────────────────────────────────────────────────────────┘
```

Seller block comes from `seller` (env-configured server-side) — don't hardcode
it. Logo is yours; the backend copy lives at `src/app/assets/images/icon.png`.

Design tokens (shared with our transactional emails, so the invoice matches):

| Role                    | Hex                   |
| ----------------------- | --------------------- |
| Heading / strong text   | `#2d3748`             |
| Body text               | `#4a5568`             |
| Muted (periods, footer) | `#718096` / `#a0aec0` |
| Brand accent            | `#2b6cb0`             |
| Table rules             | `#e2e8f0` / `#edf2f7` |

Multi-page: repeat the column header, put the footer and `Page N of M` on every
page. Don't let the totals ladder split across a page break.

### PDF export

Any client-side route is fine — `react-pdf`/`@react-pdf/renderer`, `pdfmake`, or
print-to-PDF via a print stylesheet. Suggested filename:
`invoice-<invoice_number>.pdf`.

Also surface Stripe's own documents when present: `hosted_invoice_url` ("View
receipt") and `invoice_pdf` ("Stripe PDF"). They're the authoritative copy and
cost nothing to link.

---

## 6. Errors

| Status    | When                                          | UI                                                                       |
| --------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| 400       | non-numeric / out-of-range `:id`              | treat as not found                                                       |
| 401 / 403 | not logged in, or role isn't admin/manager/hr | hide the billing page                                                    |
| 404       | unknown invoice, or another company's invoice | "Invoice not found"                                                      |
| 402       | workspace locked by the entitlement gate      | existing lockout flow                                                    |
| 5xx       | —                                             | retry once, then show a retry button; don't render a half-empty document |

Detail responses can be cached briefly per invoice id — a settled invoice never
changes. Don't cache the list page (it self-heals).

---

## 7. Checklist

- [ ] Billing page shows invoices after a test-mode checkout (no `stripe listen` needed)
- [ ] Row uses `detail_path`; `voided` badge handled separately from `status`
- [ ] Detail view renders lines + totals ladder; totals come from `totals`, not summed lines
- [ ] `lines[].period_*` parsed as **seconds**
- [ ] Proration rows print `amount_cents` (negative values render as credits)
- [ ] `lines_truncated` shows the "first 20 of N" note + Stripe link
- [ ] `refunded_cents > 0` renders a Refunded row
- [ ] Non-Latin company name renders correctly in the exported PDF
- [ ] Multi-page PDF repeats header + footer with page numbers
- [ ] No aggressive timeout on the first billing-page load

Questions on the contract → ping backend; the response is assembled in
`PackageService.getBillingInvoiceDetail`.
