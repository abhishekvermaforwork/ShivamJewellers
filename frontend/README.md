# InvoiceHub Web (Next.js)

InvoiceHub is now fully migrated to Next.js App Router.
The UI and API run in the same Next.js application:

- UI routes live under `app/(auth)` and `app/(main)`.
- API endpoints are handled by Next.js Route Handlers under `app/api/v1/[[...path]]`.
- Legacy controller/service/model logic is reused via `server/` and dispatched through the route handler bridge.

## Local development

1. Copy the environment template:

   ```bash
   cp .env.local.example .env.local
   ```

2. Install dependencies and run:

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000).

## Required environment variables

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret (must not use default in production)
- `JWT_EXPIRES_IN` - token TTL (example: `7d`)
- `NODE_ENV` - `development` or `production`

Optional:

- `NEXT_PUBLIC_API_URL` - public API base URL override (defaults to same-origin `/api/v1`)
- `INTERNAL_API_URL` - server-side API base URL override for SSR calls

## Production checklist

1. Use a strong `JWT_SECRET`.
2. Set `NODE_ENV=production`.
3. Build and validate before deploy:

   ```bash
   npm run lint
   npm run type-check
   npm run build
   ```

4. Run:

   ```bash
   npm run start
   ```

5. Health endpoint:

   ```text
   GET /api/health
   ```

## Docker

A multi-stage `Dockerfile` is included for production images (`next build` standalone output).

Build and run:

```bash
docker build -t invoicehub-web .
docker run -p 3000:3000 --env-file .env.local invoicehub-web
```
