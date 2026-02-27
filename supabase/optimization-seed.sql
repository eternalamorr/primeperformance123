-- Seed for optimization tables

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

-- Example admin user with placeholder hash (replace before production)
insert into admin_users (username, password_hash, is_active, role)
values ('admin', 'REPLACE_WITH_HASH', false, 'admin')
on conflict (username) do nothing;
