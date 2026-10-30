# Reports → Total Revenue: Credit & Paid Order Cards

How the **Credit Paid Amount**, **Credit Remaining** and **Paid Order Amount** cards on the Reports page are calculated, how their detail pages work, and what was changed (October 2026).

Code lives in two repos:

- **Frontend**: `imax-pos/` (React + TypeScript + Vite + Tailwind)
- **Backend**: `i-max-pos/` (Express + Mongoose)

---

## 1. Overview

Reports → **Total Revenue** tab (`imax-pos/pages/Reports.tsx` → `components/Reports/TotalRevenueTab.tsx`) shows four cards for **one chosen date** and **one storefront (or all)**:

| Card | Clickable | Detail page |
|---|---|---|
| Total Inventory Value | No | — |
| Credit Remaining | Yes | `/reports/credit-remaining` |
| Credit Paid Amount | Yes | `/reports/credit-payments` |
| Paid Order Amount | Yes | `/reports/paid-orders` |

**Total Revenue** = sum of the visible cards (the gear icon toggles which cards are included).

**Rule:** every card and its detail page must show the **same number** for the same date + storefront. If you change how a card is calculated, change the detail page's endpoint the same way (or, better, have both use the same endpoint).

---

## 2. Core concepts (read this first)

### 2.1 `order.paidAmount` is denormalized

`order.paidAmount` = **initial payment at checkout + every credit payment recorded since**.
Each credit payment (`POST /credit-record` → `createCreditPayment` in `creditRecord.controller.js`) creates a `CreditRecord` **and** adds its amount to `order.paidAmount`.

So:

```
creditPaidForOrder = Σ CreditRecord.paidAmount  (isDeleted: false, same orderId)
initialPaid        = max(0, order.paidAmount − creditPaidForOrder)
remainingNow       = max(0, order.finalAmount − order.paidAmount)
```

⚠️ **Never** compute `order.paidAmount + Σ credit records`. That counts credit payments twice (this bug existed in `getCreditRecordsByOrderId` and was fixed).

### 2.2 Change given back on paid orders

For paid (non-credit) orders, `order.paidAmount` is the cash the customer handed over, so it **includes change**.
`order.extraChange = max(0, paidAmount − finalAmount)` (set by the pre-save hook in `models/orders.model.js`).

```
netAmount = paidAmount − extraChange      // the money the shop actually keeps
```

### 2.3 Dates are Myanmar time

`i-max-pos/src/utils/dateFilter.utils.js` → `createDateFilter()` parses `startDate` / `endDate` in **`Asia/Yangon`** (`REPORT_TIMEZONE`) and uses start/end of day in that timezone.

- Before: days were cut in UTC, so a "day" ran 06:30 → 06:29 Myanmar time.
- After: a day is 00:00 → 23:59:59 Myanmar time.
- This affects **every** endpoint that calls `createDateFilter` (orders, credit records, GRNs, …). Historical report numbers shifted slightly after this fix. That is expected.

The frontend sends dates as `YYYY-MM-DD` built from the local date (`formatDateParam` / `parseDateParam` in `components/Reports/reportUtils.ts`). Don't use `new Date("YYYY-MM-DD")`, which is parsed as UTC.

### 2.4 Fixed start date `2025-12-01`

Credit Remaining only considers credit orders created **from `2025-12-01`** to the chosen date. The value is hardcoded in `Reports.tsx` → `loadRevenueData()` (`fixedStartStr`) and passed to the credit-remaining endpoint. Treat it as the system go-live date. See [Known issues](#9-known-issues--open-decisions).

### 2.5 Storefront filter on credit records

`CreditRecord` has no storefront field. `GET /credit-record?storefrontId=…` filters by looking up the orders of that storefront first (`Order.find({ storefrontId })` → `orderId: { $in: ids }`). Before this fix the param was silently ignored, and every storefront showed the all-storefronts total.

---

## 3. Credit Paid Amount

**Meaning:** money collected on the chosen date from customers paying back credit (debt).

### Card

- Source: `Reports.tsx` → `fetchCreditRecords(date, date, storefront)` → `GET /credit-record?startDate=D&endDate=D&storefrontId=…`
- Value: `Σ record.paidAmount` of the returned records (filtered by `paymentDate`).
- Does **not** include down payments made at checkout on credit orders (see §9).

### Detail page: `/reports/credit-payments`

- File: `pages/CreditPayments.tsx`
- URL params: `?date=YYYY-MM-DD&storefront=<id|all>`
- API: `fetchCreditRecords(date, date, storefront, undefined, true)` → `GET /credit-record?…&includeOutstanding=true`
- Summary cards: Total Collected (matches the card) · Payments · Customers
- One table, one row per payment: Time · Customer · Order no. (+ notes) · Storefront (only when "all") · Method · Amount paid · **Remaining (as of today)**
- Row click → `/credits/:creditPersonId` (Credit Sales detail, Payments tab)

### Backend: `GET /credit-record` (`getAllCreditRecords`)

| Query param | Effect |
|---|---|
| `startDate`, `endDate` | Filter on `paymentDate` (Myanmar time) |
| `storefrontId` | Only records whose order belongs to this storefront |
| `includeOutstanding=true` | Adds `outstandingByPerson: { [creditPersonId]: number }` |
| `page`, `limit` | Pagination (only when passed) |

`outstandingByPerson` = each customer's **current** total debt across **all storefronts**, computed with one aggregation:
`Σ max(0, finalAmount − paidAmount)` over the customer's `paymentType: "credit"`, non-deleted orders.

Populated fields: `orderId` (orderNumber, finalAmount, paymentType, storefrontId → locationName, creditPersonId → name/phone), `creditPersonId` (name, phone), `addedBy` (name, email).
If a record's `creditPersonId` is null, the UI falls back to `orderId.creditPersonId` (`getCreditRecordPerson` in `reportUtils.ts`).

---

## 4. Credit Remaining

**Meaning:** how much customers still owe **as of the end of the chosen date**, for credit orders created from 2025-12-01.

### Card

- Source: `Reports.tsx` → `fetchCreditRemaining("2025-12-01", date, storefront)` → `GET /sale-report/credit-remaining`
- Value: `data.totals.totalRemaining`
- The card and the detail page use the **same endpoint**, so they always match.
- Previously the card was computed client-side from up to 1000 credit records, which silently undercounted once there were more than 1000 records. Don't go back to that.

### Detail page: `/reports/credit-remaining`

- File: `pages/CreditRemaining.tsx`
- URL params: `?date=YYYY-MM-DD&storefront=<id|all>`
- Summary cards: Total Remaining · Customers owing · Unpaid orders
- One table, one row per customer (sorted by remaining, descending): Customer · Unpaid orders · Total credit · Paid · **Remaining** · Owing since (oldest unpaid order + days)
- Row click → `/credits/:creditPersonId` (Orders tab). The "No customer assigned" row → `/credit-orders`.
- Fully paid customers are not listed.

### Backend: `GET /sale-report/credit-remaining` (`getCreditRemainingReport` in `saleReport.controller.js`)

Query: `storefrontId` (optional), `startDate`, `endDate`.

1. Orders: `isDeleted: false`, `orderStatus: "completed"`, `paymentType: "credit"`, `createdAt` in range, optional storefront.
2. All their non-deleted credit records in **one** query.
3. Per order, **as of `endDate`**:
   ```
   initialPaid = max(0, order.paidAmount − Σ ALL credit records of the order)
   paidAsOf    = initialPaid + Σ credit records with paymentDate ≤ end of endDate
   remaining   = max(0, finalAmount − paidAsOf)
   ```
4. Keep orders with `remaining > 0` and group them by `order.creditPersonId` (`null` = no customer).

Response:

```json
{
  "success": true,
  "data": {
    "dateRange": { "startDate": "...", "endDate": "..." },
    "totals": { "totalRemaining": 42800, "customerCount": 3, "unpaidOrderCount": 5 },
    "customers": [
      {
        "creditPerson": { "_id": "...", "name": "Daw Hla", "phone": "..." },
        "unpaidOrderCount": 2,
        "totalCredit": 60000,
        "totalPaid": 17200,
        "remaining": 42800,
        "oldestUnpaidOrderDate": "..."
      }
    ]
  }
}
```

---

## 5. Paid Order Amount

**Meaning:** money kept from direct (non-credit) sales on the chosen date, **excluding change given back**.

### Card

- Source: `Reports.tsx` → `fetchPaidOrdersReport(storefront, date, date)` (or the all-storefronts variant) → `GET /sale-report/paid-orders`
- Value: `data.totals.totalNetAmount`
- Previously the card used `totalPaidAmount`, which includes change. A 8,000 MMK sale paid with 10,000 counted as 10,000.

### Detail page: `/reports/paid-orders`

- File: `pages/PaidOrdersDetail.tsx`
- URL params: `?date=YYYY-MM-DD&storefront=<id|all>&method=<paymentMethod>`
- API: `fetchPaidOrdersList(date, date, storefront)` → `GET /sale-report/paid-orders/list`
- Summary cards: **Net Received** (matches the card) · Orders · Sales Amount (+ "Change given")
- Payment-method chips filter the table (kept in `?method=`). The summary cards always show the whole day.
- Table: Time · Order no. · Storefront (only when "all") · Items · Method · Bill · Received · Change · **Net** · Sold by
- Row click → existing `OrderDetailModal`

### Backend

Both endpoints use the same filter: `isDeleted: false`, `orderStatus: "completed"`, `paymentType: "paid"`, `createdAt` in range, optional `storefrontId`.

**`GET /sale-report/paid-orders`** (`getPaymentMethodReportByStorefrontId`), aggregated per payment method:

- `totals`: `totalPaidAmount`, `totalFinalAmount`, `totalExtraChange`, **`totalNetAmount`**, `totalOrderCount`
- `paymentMethods[]`: same fields per method
- Change is computed as `$max: [0, paidAmount − finalAmount]` (same rule as the pre-save hook).

**`GET /sale-report/paid-orders/list`** (`getPaidOrdersList`), one row per order, newest first:

- `totals`: `totalPaidAmount`, `totalFinalAmount`, `totalExtraChange`, `totalNetAmount`, `orderCount`
- `paymentMethods[]`: `paymentMethod`, `totalPaidAmount`, `totalNetAmount`, `orderCount`
- `orders[]`: `_id`, `orderNumber`, `createdAt`, `storefront`, `itemCount`, `paymentMethod`, `finalAmount`, `paidAmount`, `extraChange`, `netAmount`, `soldBy`

`totals.totalNetAmount` must be equal in both endpoints for the same filters.

---

## 6. Navigation & URL state

All filters live in the URL, so refresh, back and shared links keep the same view.

| Page | Params |
|---|---|
| `/reports` | `tab` (e.g. `revenue`), `date`, `start` (range tabs), `storefront` |
| `/reports/credit-payments` | `date`, `storefront` |
| `/reports/credit-remaining` | `date`, `storefront` |
| `/reports/paid-orders` | `date`, `storefront`, `method` |

- Card click: `TotalRevenueTab.tsx` → `openReportDetail(page)` → `/reports/<page>?date=…&storefront=…`
- Back button on the detail pages: `/reports?tab=revenue&date=…&storefront=…`
- `Reports.tsx` reads these on load. A storefront that comes from the URL is **not** overridden by the "default to first storefront" logic (`storefrontFromUrl` ref).

The three detail pages share `components/Reports/CreditReportLayout.tsx`:

- `useCreditReportFilters()` reads/writes `date` + `storefront` and loads the storefront list
- `CreditReportHeader` (back button, title, storefront select, single-date picker)
- `SummaryCard`

Routes are registered in `App.tsx` inside `ProtectedRoute`, **before** the `*` catch-all.

---

## 7. Error & loading behaviour (Total Revenue tab)

- The spinner shows only while `loadingRevenue` is true.
- An empty stock list is valid: it shows MMK 0 and "0 products" (it used to spin forever).
- If any request fails, an error card with **Retry** (`loadRevenueData`) is shown.

---

## 8. File map

### Frontend (`imax-pos/`)

| File | Role |
|---|---|
| `pages/Reports.tsx` | Loads all revenue data (`loadRevenueData`), URL state |
| `components/Reports/TotalRevenueTab.tsx` | The four cards, card click → detail page, error card |
| `pages/CreditPayments.tsx` | Credit Paid detail page |
| `pages/CreditRemaining.tsx` | Credit Remaining detail page |
| `pages/PaidOrdersDetail.tsx` | Paid Orders detail page |
| `components/Reports/CreditReportLayout.tsx` | Shared header / filters hook / summary card |
| `components/Reports/reportUtils.ts` | `formatCurrency`, `formatDateParam`, `parseDateParam`, `getCreditRecordPerson` |
| `services/Reports/fetchCreditRecords.ts` | `GET /credit-record` (+ `includeOutstanding`) |
| `services/Reports/fetchCreditRemaining.ts` | `GET /sale-report/credit-remaining` |
| `services/Reports/fetchPaidOrdersReport.ts` | `GET /sale-report/paid-orders` |
| `services/Reports/fetchPaidOrdersList.ts` | `GET /sale-report/paid-orders/list` |
| `App.tsx` | Routes |

### Backend (`i-max-pos/src/`)

| File | Role |
|---|---|
| `controllers/creditRecord.controller.js` | `getAllCreditRecords` (storefront filter, `outstandingByPerson`), `createCreditPayment`, `getCreditRecordsByOrderId` |
| `controllers/saleReport.controller.js` | `getPaymentMethodReportByStorefrontId`, `getPaidOrdersList`, `getCreditSaleReportByStorefrontId`, `getCreditRemainingReport` |
| `routes/saleReport.route.js` | `/sale-report/paid-orders`, `/paid-orders/list`, `/credit-orders`, `/credit-remaining` (roles: owner, admin, cashier) |
| `utils/dateFilter.utils.js` | `createDateFilter` (Asia/Yangon) |
| `models/orders.model.js` | `paidAmount`, `extraChange` pre-save hook |

---

## 9. Known issues & open decisions

1. **Down payments on credit orders are not in Total Revenue.**
   Example: a 50,000 credit sale with 10,000 paid at checkout today. Credit Remaining shows 40,000, Credit Paid only counts later credit records, and Paid Orders only counts `paymentType: "paid"`. The 10,000 isn't counted anywhere. *Business decision pending:* add it to Credit Paid, or add a separate card.
2. **`2025-12-01` is hardcoded** in `Reports.tsx`. Debt on credit orders created before that date is not counted. Confirm it's the go-live date, or move it to config.
3. **Small inconsistency:** the `outstandingByPerson` aggregation in `getAllCreditRecords` does **not** filter `orderStatus: "completed"`, while `getCreditRemainingReport` and the Credit Sales detail summary do. If a cancelled credit order still has a balance, "Remaining (as of today)" on the Credit Payments page will be higher. Fix: add `orderStatus: "completed"` to that `$match`.
4. **Credit Payments "Remaining" is today's balance across all storefronts.** Credit Remaining is "as of the chosen date" for the chosen storefront. This is intentional: the columns answer different questions.
5. **"Total Revenue" mixes concepts:** inventory value (stock at selling price), receivables (Credit Remaining) and cash collected. It's closer to "total value" than revenue. Rename it if it confuses users.
6. **Cleanup:**
   - `loadRevenueData` still fetches the credit-orders report, but no card uses it any more.
   - Switching tabs can trigger the same load twice (`handleTabChange` + `useEffect`).
   - The same-day `fetchCreditRecords` call still uses `limit=1000` (fine for one day).
7. `dateFilter.utils.js` contains ~170 lines of old commented-out code (kept from before).

---

## 10. Changelog (October 2026)

- Cards made clickable, with three new detail pages and routes (§3–5).
- `GET /credit-record` now honours `storefrontId` (it was ignored) and supports `includeOutstanding`.
- New `GET /sale-report/credit-remaining`. The Credit Remaining card now uses it (it was client-side and capped at 1000 records).
- Paid orders: added `totalNetAmount` / `netAmount`. The card now excludes change.
- New `GET /sale-report/paid-orders/list`.
- `createDateFilter` now uses Asia/Yangon day boundaries.
- `getCreditRecordsByOrderId`: fixed double counting of credit payments.
- Total Revenue tab: no more endless spinner, plus an error card with Retry.
- Reports and detail pages keep their filters in the URL.

---

## 11. How to verify after changes

For **All Storefronts** and **one storefront**, on **today** and **an older date**:

1. Credit Paid card = Total Collected on `/reports/credit-payments`.
2. Credit Remaining card = Total Remaining on `/reports/credit-remaining`.
3. Paid Order card = Net Received on `/reports/paid-orders`. Also `/sale-report/paid-orders` and `/paid-orders/list` return the same `totalNetAmount`.
4. An order created at 01:00 Myanmar time shows under that same day.
5. A paid order with change (e.g. bill 8,000, received 10,000) adds 8,000 to Paid Order Amount.
6. A customer's remaining on `/reports/credit-remaining` (date = today) = their Outstanding on `/credits/:id`.
