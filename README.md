# Good Noura

Next.js shop with an admin panel at `/admin`. Data lives in Supabase (Postgres + Storage). Deploys to Netlify.

## Setup
1. Create a Supabase project. In **SQL Editor**, run `supabase/schema.sql`.
2. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).
3. `npm install`, then `npm run migrate` to copy the old local database (`data/goodnoura.db`) into Supabase.
4. `npm run dev` → http://localhost:5173 (admin: /admin).

## Netlify
Site configuration → Environment variables: add the same two variables, then deploy.
Never commit `.env.local`. The service-role key must only ever live on the server.

## Layout
- `legacy/*.html`, `public/site.js`, `public/admin.js`: the pages and their scripts (design unchanged).
- `app/**/page.js`: one Next.js route per page. `app/api/**`: the backend routes.
- `lib/server.js`: pricing, shipping, login and database helpers.
- `legacy-server/`: the old Node + SQLite server, kept for reference only.
