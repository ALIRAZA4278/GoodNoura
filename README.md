# Good Noura

Next.js shop with an admin panel at `/admin`. Data lives in Supabase (Postgres + Storage). Runs on a VPS (nginx + pm2) at goodnoura.com.

## What it does
- **Shop:** home, bundles / single jars, product pages (photo per size), make-your-own-bundle, checkout (cash on delivery or bank transfer, 10% off online), `/thank-you`, contact, our story, privacy policy, terms. Floating WhatsApp button and the Meta Pixel on every shop page.
- **Admin (`/admin`):** orders (status, notes, edit customer, bulk status, CSV), WhatsApp update button for every status, abandoned carts, products and bundles, reviews, promo codes, settings (bank details, delivery fee, contact numbers).
- **Emails (nodemailer / Gmail):** new-order alert to the shop, confirmation to the customer, and an email to the customer on every status change.
- **Insta World courier:** book, track, cancel, download the airway bill and export a bulk CSV from an order. The API key stays on the server.

## Setup
1. Create a Supabase project. In **SQL Editor** run `supabase/schema.sql` (safe to run again).
2. Copy `.env.example` to `.env.local` and fill it in (see the table below).
3. `npm install`
4. `npm run migrate` copies an old local database (`data/goodnoura.db`) into Supabase (only needed once, if you have one).
5. `npm run dev` → http://localhost:5173 (admin: /admin).

## Environment variables (`.env.local`, never commit it)
| Name | What it is |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API. The service key must only ever live on the server. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Order emails. For Gmail use an *App password* (needs 2-step verification). |
| `ADMIN_EMAIL` | Inbox that receives new-order emails. |
| `ADMIN_LOGIN_EMAIL` | Email used to sign in to `/admin` (default `admin@goodnoura.com`). The password is set on first visit or in Admin → Settings and is stored hashed in Supabase. |
| `INSTAWORLD_API_KEY` | Insta World courier API key. |

## Deploy on the VPS
```bash
cd /var/www/GoodNoura
git pull && npm ci && npm run build && pm2 restart goodnoura
```
nginx proxies goodnoura.com to the app's port (see the pm2 start command in your notes); HTTPS comes from certbot.

## Netlify copy
The repository also builds on Netlify, but Netlify's automatic GitHub builds do not run the Next.js server correctly for this project, so automatic builds are switched off. To update the Netlify copy by hand: `npx netlify-cli deploy --build --prod`. The Netlify copy has no email or courier variables unless you add them in Netlify → Environment variables.

## Layout
- `legacy/*.html`, `public/site.js`, `public/admin.js`, `public/*.css`: the pages and their scripts (design unchanged).
- `app/**/page.js`: one Next.js route per page. `app/api/**`: the backend routes (`app/api/admin/[...path]` is the admin API).
- `lib/server.js` (pricing, shipping, login, database), `lib/email.js`, `lib/instaworld.js`, `lib/ratelimit.js`.
- `supabase/schema.sql`: database tables. `scripts/migrate-to-supabase.mjs`: one-off import.
- `legacy-server/`: the old Node + SQLite server, kept for reference only.
