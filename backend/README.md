# InvoiceHub API (Express + MongoDB)

Production-oriented REST API migrated from the Django InvoiceHub project. All routes are under **`/api/v1`**.

## Requirements

- Node.js 20+
- MongoDB 6+ (local or Atlas)

## Setup

1. Copy environment file:

   ```bash
   cp .env.example .env
   ```

2. Set `MONGO_URI` and `JWT_SECRET` in `.env`.

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   The process listens on `PORT` (default **4000**). Health check: `GET /health`.

## Authentication

- `POST /api/v1/auth/register` — create account (returns JWT).
- `POST /api/v1/auth/login` — obtain JWT.
- `GET /api/v1/auth/me` — current user + optional `businessProfile` (requires `Authorization: Bearer <token>`).
- `PATCH /api/v1/auth/profile` — create/update `BusinessProfile` (business name, invoice prefix, bank details, etc.).

## Stripe webhook

Configure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. The endpoint **`POST /api/v1/payments/webhook/stripe`** expects the **raw** JSON body (as Stripe sends it); it is registered **before** `express.json()` in `src/app.js`.

## Project layout

| Path | Role |
|------|------|
| `server.js` | Entry, HTTP server, DB connect |
| `src/app.js` | Express app, security middleware, routes |
| `src/config/` | Env, logger, database |
| `src/models/` | Mongoose schemas (Django models parity) |
| `src/services/` | Business logic (invoice totals, stock, dashboard, …) |
| `src/controllers/` | HTTP handlers |
| `src/routes/v1/` | Versioned routes |
| `src/middlewares/` | Auth, validation, errors |
| `src/validators/` | Joi schemas |

## Documentation

See **`API.md`** for a concise endpoint list and conventions.
