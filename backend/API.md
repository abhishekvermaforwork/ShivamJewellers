# InvoiceHub REST API (`/api/v1`)

Unless noted, responses are JSON:

```json
{ "success": true, "data": { } }
```

Errors:

```json
{ "success": false, "error": { "message": "...", "code": "OPTIONAL" } }
```

## Public

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Body: `username`, `email`, `password`, optional `firstName`, `lastName`. Returns `{ user, token }`. |
| POST | `/auth/login` | Body: `username` (or email), `password`. Returns `{ user, token }`. |
| GET | `/public/invoices/:token` | Public invoice by `viewToken` (UUID). |

## Authenticated (header: `Authorization: Bearer <token>`)

### Account

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/me` | User + business profile. |
| PATCH | `/auth/profile` | Upsert `BusinessProfile` (e.g. `businessName`, `invoicePrefix`, `bankDetails`, …). |

### Dashboard & sales

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | KPIs: revenue month, outstanding, overdue, recent invoices, top clients. |
| GET | `/sales/report` | Query: `dateFrom`, `dateTo` — gold/silver sold weight + invoice list in range. |

### Clients

| Method | Path | Description |
|--------|------|-------------|
| GET | `/clients` | Query: `q`, `page`, `limit`. |
| GET | `/clients/:id` | Detail + invoices + aggregates. |
| POST | `/clients` | Create. |
| PATCH | `/clients/:id` | Partial update. |
| DELETE | `/clients/:id` | Delete. |

### Invoices

| Method | Path | Description |
|--------|------|-------------|
| GET | `/invoices` | Query: `q`, `date` (YYYY-MM-DD), `page`, `limit`. |
| GET | `/invoices/:id` | Invoice + line items + payments. |
| POST | `/invoices` | Create (optional `lineItems[]`). Credit invoices require `client`. |
| PATCH | `/invoices/:id` | Update; send `lineItems` to replace all lines (same semantics as Django formset). |
| DELETE | `/invoices/:id` | Deletes lines, payments, restores stock. |
| PATCH | `/invoices/:id/due-date` | Body: `{ "dueDate": "<iso>" \| null }`. |

### Payments (invoice + history)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/payments/history` | All payments for user’s invoices. |
| POST | `/invoices/:invoiceId/payments` | Partial payment. |
| POST | `/invoices/:invoiceId/mark-paid` | Pay remaining balance. |
| POST | `/invoices/:invoiceId/mark-unpaid` | Clear payments (not allowed for cash invoices). |

### Inventory

| Method | Path | Description |
|--------|------|-------------|
| GET | `/inventory/categories` | Categories + total gold/silver availability summary. |
| GET | `/inventory/categories/:id` | Category drill-down (piece or weight mode). |
| POST | `/inventory/categories` | Create category. |
| PATCH | `/inventory/categories/:id` | Update. |
| DELETE | `/inventory/categories/:id` | Delete. |
| POST | `/inventory/items` | Create piece item. |
| PATCH | `/inventory/items/:id` | Update item. |
| DELETE | `/inventory/items/:id` | Delete item. |
| POST | `/inventory/items/:id/mark-sold` | Manual sold. |
| POST | `/inventory/items/:id/mark-unsold` | Restore (blocked if linked to invoice). |
| POST | `/inventory/weight-stock` | Add weight stock entry. |
| DELETE | `/inventory/weight-stock/:id` | Remove entry. |

### Suppliers & purchases

| Method | Path | Description |
|--------|------|-------------|
| GET | `/suppliers` | List + rolling totals. |
| POST | `/suppliers` | Create. |
| PATCH | `/suppliers/:id` | Update. |
| DELETE | `/suppliers/:id` | Delete. |
| GET | `/purchases` | Query: `supplierId` optional. |
| POST | `/purchases` | Create purchase bill. |
| PATCH | `/purchases/:id` | Update. |
| DELETE | `/purchases/:id` | Delete. |

### Petty cash & advances

| Method | Path | Description |
|--------|------|-------------|
| GET | `/petty-expenses` | Query: `date`, or `startDate` + `endDate`. |
| POST | `/petty-expenses` | Create. |
| DELETE | `/petty-expenses/:id` | Delete. |
| GET | `/advance-payments` | Query: `q`, `date`. |
| POST | `/advance-payments` | Create. |
| DELETE | `/advance-payments/:id` | Delete. |

## Field naming

JSON uses **camelCase** (`invoiceType`, `cashClientName`, `cgstRate`, `lineItems`, …), aligned with typical JavaScript clients while preserving Django semantics in services.
