-- Prime Performance: standalone PostgreSQL init (no Supabase required)

create extension if not exists "pgcrypto";

-- Core catalog table
create table if not exists products (
  id bigint primary key,
  name text not null,
  price text not null,
  segment text not null default 'standard' check (segment in ('standard', 'premium')),
  description text,
  full_description text,
  features text[] not null default '{}',
  specs jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  color_gallery jsonb,
  badge text,
  image text,
  gallery jsonb not null default '[]'::jsonb,
  is_upgrade boolean not null default false
);

create index if not exists idx_products_segment_id on products (segment, id);

-- Orders from public forms
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null check (source in ('cart', 'product', 'configurator')),
  customer_name text not null,
  customer_phone text not null,
  items jsonb,
  configuration jsonb,
  total_price integer,
  status text not null default 'new'
);

create index if not exists idx_orders_created_at on orders (created_at desc);
create index if not exists idx_orders_status on orders (status);

-- Runtime settings table
create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  description text,
  updated_at timestamptz not null default now()
);

-- Configurator extras
create table if not exists product_extras (
  id text primary key,
  label text not null,
  price integer not null check (price >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_extras_active_sort
  on product_extras (is_active, sort_order, id);

-- Admin users for /admin login
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

-- Shared API rate limit store
create table if not exists api_rate_limits (
  key text primary key,
  count integer not null check (count >= 0),
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_api_rate_limits_reset_at
  on api_rate_limits (reset_at);

-- Queue for orders when DB write/notification has transient errors
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

create index if not exists idx_pending_orders_retry
  on pending_orders (processed_at, next_retry_at, created_at);

-- Generic updated_at trigger
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

-- DB-backed fixed window limiter used by app/api/*
create or replace function consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_ms integer
)
returns table(ok boolean, remaining integer, reset_at timestamptz)
language plpgsql
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

-- Seed products (standard + premium)
insert into products (
  id, name, price, segment, description, full_description,
  features, specs, colors, color_gallery, badge, image, gallery, is_upgrade
)
values
(
  1,
  'PRIME PERFORMANCE BMW M5 COMPETITION',
  '139 990',
  'standard',
  'Офисное кресло бизнес-класса в стиле BMW M5 F90',
  'Флагманская модель для переговорных и кабинетов руководителей.',
  array['Натуральная кожа','Премиальный комфорт','Интеллигентная поддержка','Анатомическая посадка','Деловой характер'],
  '[{"label":"Макс. нагрузка","value":"150 кг"},{"label":"Высота спинки","value":"85 см"},{"label":"Ширина сиденья","value":"52 см"},{"label":"Угол наклона","value":"90° - 180°"},{"label":"Каркас","value":"Сталь"},{"label":"Гарантия","value":"1 год"}]'::jsonb,
  '[{"name":"Черный","hex":"#1a1a1a"},{"name":"Черно-белый","hex":"#1a1a1a","splitHex":["#1a1a1a","#f5f5f5"]},{"name":"Красный","hex":"#ff2847"}]'::jsonb,
  '{"Черный":["/chairs/m5/black/bmw-m5-black-img-1.png","/chairs/m5/black/bmw-m5-black-img-2.png"],"Черно-белый":["/chairs/m5/black-white/bmw-m5-black-white-img-1.png"],"Красный":["/chairs/m5/red/bmw-m5-red-img-1.png"]}'::jsonb,
  null,
  '/chairs/catalog%20main%20photos/m5-catalog-main-photo.png',
  '["/chairs/m5/red/bmw-m5-red-img-1.png","/chairs/m5/black/bmw-m5-black-img-1.png"]'::jsonb,
  false
),
(
  2,
  'PRIME PERFORMANCE BMW M4 COMPETITION',
  '139 990',
  'standard',
  'Премиальное офисное кресло с динамичным характером',
  'Бизнес-класс с агрессивной геометрией BMW M4.',
  array['Натуральная кожа','Спортивная эргономика','Жесткая фиксация','Активная поддержка','Динамичный характер'],
  '[{"label":"Макс. нагрузка","value":"150 кг"},{"label":"Высота спинки","value":"82 см"},{"label":"Ширина сиденья","value":"50 см"},{"label":"Угол наклона","value":"90° - 180°"},{"label":"Каркас","value":"Сталь"},{"label":"Гарантия","value":"1 год"}]'::jsonb,
  '[{"name":"Черно-оранжевый","hex":"#1a1a1a","splitHex":["#1a1a1a","#ff7a1a"]},{"name":"Черный","hex":"#1a1a1a"}]'::jsonb,
  '{"Черно-оранжевый":["/chairs/m4/black-orange/bmw-m4-black-orange-img-1.png"],"Черный":["/chairs/m4/black/bmw-m4-black-img-1.png"]}'::jsonb,
  null,
  '/chairs/catalog%20main%20photos/m4-catalog-main-photo.png',
  '["/chairs/m4/black/bmw-m4-black-img-1.png","/chairs/m4/black/bmw-m4-black-img-2.png"]'::jsonb,
  false
),
(
  3,
  'PRIME PERFORMANCE M8 COMPETITION',
  '139 990',
  'standard',
  'Офисное кресло премиум-класса с акцентом на статус',
  'Выразительная модель в стиле M8.',
  array['Премиальная кожа','Усиленная поддержка','Высокий профиль спинки','Выразительная геометрия','Статусный дизайн'],
  '[{"label":"Макс. нагрузка","value":"140 кг"},{"label":"Высота спинки","value":"87 см"},{"label":"Ширина сиденья","value":"54 см"},{"label":"Угол наклона","value":"90° - 180°"},{"label":"Каркас","value":"Карбон + Сталь"},{"label":"Гарантия","value":"1 год"}]'::jsonb,
  '[{"name":"Черный","hex":"#1a1a1a"},{"name":"Черно-оранжевый","hex":"#1a1a1a","splitHex":["#1a1a1a","#ff7a1a"]}]'::jsonb,
  '{"Черный":["/chairs/m8/black/bmw-m8-black-img-1.png"],"Черно-оранжевый":["/chairs/m8/black-orange/bmw-m8-black-orange-img-1.png"]}'::jsonb,
  null,
  '/chairs/catalog%20main%20photos/m8-catalog-main-photo.png',
  '["/chairs/m8/black/bmw-m8-black-img-1.png","/chairs/m8/black-orange/bmw-m8-black-orange-img-1.png"]'::jsonb,
  false
),
(
  99,
  'PREMIUM CATALOG',
  '0',
  'standard',
  'Переход в премиальный каталог',
  'Переход в премиальный каталог',
  array[]::text[],
  '[]'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb,
  null,
  '/chairs/premium-catalog-card.png',
  '[]'::jsonb,
  true
),
(
  201,
  'BENTLEY CONTINENTAL GT',
  '139 990',
  'premium',
  'Выбор для тех, кто ценит абсолютную роскошь и тишину движения.',
  'Выбор для тех, кто ценит абсолютную роскошь и тишину движения.',
  array['Натуральная кожа','Дворцовый комфорт','Мягкая поддержка','Ручная прострочка','Аристократичный статус'],
  '[{"label":"Макс. нагрузка","value":"150 кг"}]'::jsonb,
  '[{"name":"Бело синий","hex":"#1e4fa8"},{"name":"Белый","hex":"#f5f5f5"}]'::jsonb,
  '{"Бело синий":["/chairs/premium/bentley-continental-gt/white-blue/bentley-continental-gt-white-blue-img-1.png"],"Белый":["/chairs/premium/bentley-continental-gt/white/bentley-continental-gt-white-img-1.png"]}'::jsonb,
  null,
  '/chairs/premium/premium%20main%20photos/bentley.png',
  '["/chairs/premium/bentley-continental-gt/white-blue/bentley-continental-gt-white-blue-img-1.png"]'::jsonb,
  false
),
(
  202,
  'FERRARI F12',
  '139 990',
  'premium',
  'Выбор для тех, кто хочет эмоции и драйв без фильтров.',
  'Выбор для тех, кто хочет эмоции и драйв без фильтров.',
  array['Натуральная кожа','Спортивная посадка','Жесткая фиксация','Гоночная эргономика','Итальянский темперамент'],
  '[{"label":"Макс. нагрузка","value":"150 кг"}]'::jsonb,
  '[{"name":"Черно-желтый","hex":"#1a1a1a"}]'::jsonb,
  '{"Черно-желтый":["/chairs/premium/ferrari-f12/black-yellow/ferrari-f12-img-1.png"]}'::jsonb,
  null,
  '/chairs/premium/premium%20main%20photos/ferrari-f12.png',
  '["/chairs/premium/ferrari-f12/black-yellow/ferrari-f12-img-1.png"]'::jsonb,
  false
),
(
  203,
  'MERCEDES W223',
  '139 990',
  'premium',
  'Выбор для тех, кто выбирает технологии и безупречный комфорт.',
  'Выбор для тех, кто выбирает технологии и безупречный комфорт.',
  array['Натуральная кожа','Интеллектуальный комфорт','Адаптивная поддержка','Плавная посадка','Представительский статус'],
  '[{"label":"Макс. нагрузка","value":"150 кг"}]'::jsonb,
  '[{"name":"Черный","hex":"#1a1a1a"},{"name":"Тиффани","hex":"#81d8d0"}]'::jsonb,
  '{"Черный":["/chairs/premium/mercedes-w223/black/mercedes-w223-black-img-1.png"],"Тиффани":["/chairs/premium/mercedes-w223/tiffany/mercedes-w223-tiffany-img-1.png"]}'::jsonb,
  null,
  '/chairs/premium/premium%20main%20photos/w223.png',
  '["/chairs/premium/mercedes-w223/black/mercedes-w223-black-img-1.png"]'::jsonb,
  false
),
(
  204,
  'BMW XM',
  '139 990',
  'premium',
  'Выбор для тех, кто хочет мощь, контроль и современный люкс.',
  'Выбор для тех, кто хочет мощь, контроль и современный люкс.',
  array['Натуральная кожа','Массивная поддержка','Спортивный баланс','Уверенная посадка','Прогрессивный характер'],
  '[{"label":"Макс. нагрузка","value":"150 кг"}]'::jsonb,
  '[{"name":"Черно-красный","hex":"#1a1a1a"}]'::jsonb,
  '{"Черно-красный":["/chairs/premium/bmw-xm/black-red/bmw-xm-black-red-img-1.png"]}'::jsonb,
  null,
  '/chairs/premium/premium%20main%20photos/bmw-xm.png',
  '["/chairs/premium/bmw-xm/black-red/bmw-xm-black-red-img-1.png"]'::jsonb,
  false
),
(
  205,
  'LAMBORGHINI AVENTADOR',
  '139 990',
  'premium',
  'Выбор для тех, кто не признает компромиссов и хочет максимум адреналина.',
  'Выбор для тех, кто не признает компромиссов и хочет максимум адреналина.',
  array['Натуральная кожа','Агрессивная эргономика','Максимальная фиксация','Жесткая посадка','Суперкар-статус'],
  '[{"label":"Макс. нагрузка","value":"150 кг"}]'::jsonb,
  '[{"name":"Черно-белый","hex":"#1a1a1a"}]'::jsonb,
  '{"Черно-белый":["/chairs/premium/lamborghini-aventador/black-white/lamborghini-aventador-black-white-img-1.png"]}'::jsonb,
  null,
  '/chairs/premium/premium%20main%20photos/lamborghini.png',
  '["/chairs/premium/lamborghini-aventador/black-white/lamborghini-aventador-black-white-img-1.png"]'::jsonb,
  false
)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  segment = excluded.segment,
  description = excluded.description,
  full_description = excluded.full_description,
  features = excluded.features,
  specs = excluded.specs,
  colors = excluded.colors,
  color_gallery = excluded.color_gallery,
  badge = excluded.badge,
  image = excluded.image,
  gallery = excluded.gallery,
  is_upgrade = excluded.is_upgrade;

-- Seed extras
insert into product_extras (id, label, price, is_active, sort_order)
values
  ('massage', 'Массаж', 20000, true, 10),
  ('ventilation', 'Вентиляция', 20000, true, 20),
  ('heating', 'Подогрев', 20000, true, 30)
on conflict (id) do update set
  label = excluded.label,
  price = excluded.price,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

-- Seed public site settings
insert into site_settings (key, value, is_public, description)
values
  (
    'public.contact',
    '{"email":"primeperformance@mail.ru","phone":"+7 (925) 063-05-50"}'::jsonb,
    true,
    'Public contact data rendered on site'
  ),
  (
    'public.features',
    '{"useHeroVideo":false,"useRemoteProducts":true}'::jsonb,
    true,
    'Public feature flags'
  )
on conflict (key) do update set
  value = excluded.value,
  is_public = excluded.is_public,
  description = excluded.description;

-- Disabled placeholder admin; activate and replace hash after setup
insert into admin_users (username, password_hash, is_active, role)
values ('admin', 'REPLACE_WITH_HASH', false, 'admin')
on conflict (username) do nothing;
