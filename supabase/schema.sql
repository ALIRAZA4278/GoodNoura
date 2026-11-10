-- Good Noura database. Paste this whole file into Supabase → SQL Editor → Run.
create table if not exists products (id text primary key, data jsonb not null, sort integer default 0, visible boolean default true, in_stock boolean default true);
create table if not exists orders (
  id text primary key, created_at text, name text, phone text, email text, address text, city text, payment text,
  items jsonb, subtotal integer, discount integer, promo text, shipping integer default 0, total integer,
  status text, notes jsonb default '[]', timeline jsonb default '[]');
create table if not exists carts (token text primary key, created_at text, updated_at text, name text, phone text, email text, city text, items jsonb, total integer);
create table if not exists reviews (id bigint generated always as identity primary key, created_at text, name text, city text, product text, text text, published boolean default false, source text);
create table if not exists promos (code text primary key, pct integer, active boolean default true, uses integer default 0, created_at text);
create table if not exists settings (key text primary key, value jsonb);
create table if not exists sessions (token text primary key, expires bigint);

-- Only the server (service role key) may touch these tables; the browser never talks to Supabase directly.
alter table products enable row level security;
alter table orders enable row level security;
alter table carts enable row level security;
alter table reviews enable row level security;
alter table promos enable row level security;
alter table settings enable row level security;
alter table sessions enable row level security;

-- Public bucket for product photos uploaded from the admin
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict (id) do nothing;
