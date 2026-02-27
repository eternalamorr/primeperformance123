-- Additional optimization tables

create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  description text,
  updated_at timestamptz not null default now()
);

create table if not exists product_extras (
  id text primary key,
  label text not null,
  price integer not null check (price >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  is_active boolean not null default true,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists api_rate_limits (
  key text primary key,
  count integer not null check (count >= 0),
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists pending_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null,
  customer_name text not null,
  customer_phone text not null,
  items jsonb,
  configuration jsonb,
  total_price integer,
  payload jsonb not null,
  reason text not null,
  attempts integer not null default 0 check (attempts >= 0),
  next_retry_at timestamptz not null default now(),
  last_error text,
  processed_at timestamptz
);

create index if not exists idx_product_extras_active_sort
  on product_extras (is_active, sort_order, id);
create index if not exists idx_api_rate_limits_reset_at
  on api_rate_limits (reset_at);
create index if not exists idx_pending_orders_retry
  on pending_orders (processed_at, next_retry_at, created_at);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_product_extras_updated_at on product_extras;
create trigger trg_product_extras_updated_at
before update on product_extras
for each row
execute function set_updated_at();

drop trigger if exists trg_admin_users_updated_at on admin_users;
create trigger trg_admin_users_updated_at
before update on admin_users
for each row
execute function set_updated_at();

drop trigger if exists trg_site_settings_updated_at on site_settings;
create trigger trg_site_settings_updated_at
before update on site_settings
for each row
execute function set_updated_at();

drop trigger if exists trg_api_rate_limits_updated_at on api_rate_limits;
create trigger trg_api_rate_limits_updated_at
before update on api_rate_limits
for each row
execute function set_updated_at();

drop trigger if exists trg_pending_orders_updated_at on pending_orders;
create trigger trg_pending_orders_updated_at
before update on pending_orders
for each row
execute function set_updated_at();

create or replace function consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_ms integer
)
returns table(ok boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_entry api_rate_limits%rowtype;
begin
  if p_limit <= 0 then
    return query select false, 0, v_now;
    return;
  end if;

  insert into api_rate_limits as rl (key, count, reset_at, updated_at)
  values (p_key, 1, v_now + make_interval(secs => p_window_ms::double precision / 1000), v_now)
  on conflict (key)
  do update set
    count = case
      when rl.reset_at <= v_now then 1
      else rl.count + 1
    end,
    reset_at = case
      when rl.reset_at <= v_now then v_now + make_interval(secs => p_window_ms::double precision / 1000)
      else rl.reset_at
    end,
    updated_at = v_now
  returning * into v_entry;

  if v_entry.count > p_limit then
    return query select false, 0, v_entry.reset_at;
    return;
  end if;

  return query
    select true, greatest(0, p_limit - v_entry.count), v_entry.reset_at;
end;
$$;

alter table site_settings enable row level security;
alter table product_extras enable row level security;
alter table admin_users enable row level security;
alter table api_rate_limits enable row level security;
alter table pending_orders enable row level security;

drop policy if exists "Public read public site settings" on site_settings;
create policy "Public read public site settings"
  on site_settings
  for select
  using (is_public = true);

drop policy if exists "Public read product extras" on product_extras;
create policy "Public read product extras"
  on product_extras
  for select
  using (is_active = true);

-- No public policies for admin_users (service role only)
-- No public policies for api_rate_limits (service role only)
-- No public policies for pending_orders (service role only)
