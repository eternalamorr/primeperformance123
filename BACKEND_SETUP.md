# Backend Setup (Supabase + Telegram + Turnstile)

## 1) Env variables
Create `.env.local` рядом с проектом и заполни по примеру из `.env.local.example`.

Нужно:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `ALLOW_ORDERS_WITHOUT_TURNSTILE` (`0`/`1`)
- `ALLOW_PENDING_ORDER_QUEUE` (`0`/`1`)
- `ADMIN_USER`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `SUPABASE_STORAGE_BUCKET` (по умолчанию `product-images`)
- `NOTIFY_EMAIL_FALLBACK` (`0`/`1`)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`0`/`1`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_TO`

## 2) Создать таблицы в Supabase
Открой Supabase → SQL Editor и по очереди запусти:
- `supabase/schema.sql`
- `supabase/seed.sql`
- `supabase/optimization-schema.sql`
- `supabase/optimization-seed.sql`

Если таблицы уже были созданы раньше, нужно выполнить:
```
alter table products add column if not exists segment text not null default 'standard';
```
А затем выполнить `supabase/premium-seed.sql` (или добавить премиальные товары вручную).

Важно: в `supabase/schema.sql` включены RLS политики для публичного чтения товаров и публичной вставки заказов.

## 3) Запуск локально
```
pnpm install
pnpm dev
```

## 4) Проверка
- Открыть сайт → оформить заказ из каталога или корзины.
- В Supabase → Table editor → `orders` появится запись.
- В Telegram придет сообщение.

## 5) Админка
Открой `http://localhost:3000/admin` и войди под `ADMIN_USER/ADMIN_PASSWORD`.
Для production рекомендуется использовать таблицу `admin_users`:
- выполни `supabase/optimization-schema.sql`
- создай/активируй пользователя и установи `password_hash` через:
  `pnpm admin:hash 'your-password' -- --set admin`
- в production fallback на `ADMIN_USER/ADMIN_PASSWORD` отключен, используется только `admin_users`

## 6) Storage (для загрузки фото)
В Supabase → Storage:
1. Создай bucket `product-images` (Public).
2. В админке можно загружать фото прямо в карточке товара.

## 7) Управление каталогом
В Supabase → Table editor → `products` можно менять:
- `name`, `price`, `description`, `full_description`
- `image`, `gallery`, `color_gallery`
- `features`, `specs`, `colors`

Сайт автоматически тянет каталог из БД через `/api/products`.

## 8) Доп. функции товара из БД
Теперь опции в карточке товара (массаж/вентиляция/подогрев) можно редактировать в таблице `product_extras`.
Фронтенд берет их из `/api/product-extras` и использует локальный fallback, если таблица еще не создана.

## 9) Predeploy checks
- Синхронизировать пути каталога в БД: `pnpm sync:db`
- Проверить валидность всех медиа-путей: `pnpm validate:media`
- Smoke check (при запущенном `pnpm dev`): `pnpm smoke` (включает `/`, `/api/products`, `/api/product-extras`, `/api/chair-model`, и валидационный POST в `/api/orders`)
- Полный predeploy минимум: `pnpm predeploy:check`
- E2E happy-path заказа (test bypass): `BASE_URL=http://localhost:3000 E2E_BYPASS_TURNSTILE=1 E2E_FAKE_ORDER=1 pnpm e2e:order`

## 10) CI и мониторинг
- CI workflow: `.github/workflows/predeploy-checks.yml`
  проверяет `lint`, `build`, `validate:media`, `smoke`, `e2e:order`.
- Monitoring workflow: `.github/workflows/monitor.yml`
  запускается каждые 5 минут и дергает `scripts/monitor-check.mjs`.
- Pending orders retry workflow: `.github/workflows/retry-pending-orders.yml`
  запускается каждые 5 минут и ретраит отложенные заказы (`scripts/retry-pending-orders.mjs`).

Нужные GitHub Secrets для CI/monitoring:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `ADMIN_SESSION_SECRET`
- `MONITOR_BASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `MONITOR_MAX_RESPONSE_MS` (optional)
- `PENDING_ORDERS_BATCH_SIZE` (optional)
- `PENDING_ORDERS_MAX_DELAY_SECONDS` (optional)
