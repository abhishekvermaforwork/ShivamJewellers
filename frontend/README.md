# InvoiceHub Web (Next.js)

App Router + Tailwind CSS + Axios, aligned with the Django `base.html` layout (sidebar, Om Shivam Jewellers branding, blue primary actions).

## Setup

1. Copy `.env.local.example` to `.env.local` and set:

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
   ```

2. Run the API (`../backend`) on port 4000 (or change the URL).

3. Install and dev:

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are redirected to `/login`.

## Auth

- JWT is stored in `localStorage` (for Axios) and a readable `auth_token` cookie (for Next.js `middleware.ts` route protection).
- Register and login call `POST /api/v1/auth/register` and `POST /api/v1/auth/login`.

## Structure

| Path | Purpose |
|------|---------|
| `app/(auth)/` | Login & register |
| `app/(main)/` | Shell layout + app pages |
| `components/AppShell.tsx` | Sidebar, mobile drawer, logout |
| `services/` | Axios client + domain calls |
| `lib/session.ts` | Persist / clear session |
| `middleware.ts` | Protect routes; redirect `/` |

## Production

Build with `npm run build` and run `npm start`. Set `NEXT_PUBLIC_API_URL` to your deployed API origin.
