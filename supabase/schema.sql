create extension if not exists "pgcrypto";

create table if not exists products (
  id bigint primary key,
  name text not null,
  price text not null,
  segment text not null default 'standard',
  description text,
  full_description text,
  features text[] default '{}',
  specs jsonb default '[]'::jsonb,
  colors jsonb default '[]'::jsonb,
  color_gallery jsonb,
  badge text,
  image text,
  gallery jsonb default '[]'::jsonb,
  is_upgrade boolean default false
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  source text not null,
  customer_name text not null,
  customer_phone text not null,
  items jsonb,
  configuration jsonb,
  total_price integer,
  status text default 'new'
);

alter table products enable row level security;
alter table orders enable row level security;

drop policy if exists "Public read products" on products;
create policy "Public read products"
  on products
  for select
  using (true);

drop policy if exists "Public insert orders" on orders;
create policy "Public insert orders"
  on orders
  for insert
  with check (
    source in ('cart', 'product', 'configurator')
    and customer_name is not null
    and customer_phone is not null
  );
