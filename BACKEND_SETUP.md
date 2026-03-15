# Backend Setup (Timeweb PostgreSQL + S3 + Telegram + Turnstile)

## 1) Env variables
Создай `.env.local` рядом с проектом и заполни по примеру `.env.local.example`.

Обязательные:
- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `ADMIN_SESSION_SECRET`

Для админ-загрузки изображений (S3-совместимое хранилище):
- `S3_ENDPOINT`
- `S3_REGION` (обычно `ru-1`)
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_PUBLIC_BASE_URL`
- `S3_FORCE_PATH_STYLE` (`1`/`0`, для Timeweb обычно `1`)

Опционально:
- `DATABASE_SSL` (`1`/`0`)
- `PG_SSL_REJECT_UNAUTHORIZED` (`1`/`0`)
- `DATABASE_POOL_MAX`
- `ALLOW_ORDERS_WITHOUT_TURNSTILE` (`0`/`1`)
- `ALLOW_PENDING_ORDER_QUEUE` (`0`/`1`)
- `ADMIN_USER`, `ADMIN_PASSWORD` (fallback только не в production)
- `NOTIFY_EMAIL_FALLBACK`, `SMTP_*`

## 2) Инициализация БД
Подключись к Timeweb PostgreSQL и выполни:

```bash
psql "postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require" -f postgres/init.sql
```

Проверка:

```sql
select count(*) from products;
select count(*) from product_extras;
select count(*) from admin_users;
```

Ожидаемо после `init.sql`:
- `products`: 9
- `product_extras`: 3
- `admin_users`: 1 (placeholder)

## 3) Миграция данных из Supabase (если переносишь существующие данные)

```bash
pg_dump "SUPABASE_DB_URL" --schema=public --no-owner --no-privileges -f supabase_public.sql
psql "TIMEWEB_DB_URL" -f supabase_public.sql
```

## 4) Админ-пользователь
Сгенерировать hash:

```bash
pnpm admin:hash "your-password"
```

Установить hash в БД:

```bash
DATABASE_URL="..." pnpm admin:hash "your-password" -- --set admin
```

## 5) Запуск локально

```bash
pnpm install
pnpm dev
```

## 6) Проверка
- Открыть сайт и каталог
- Сделать тестовый заказ
- Проверить запись в таблице `orders`
- Проверить Telegram-уведомление
- Открыть `/admin` и проверить логин/редактирование товаров
- Проверить загрузку фото в админке

## 7) Полезные скрипты
- Синхронизация путей медиа в товарах: `pnpm sync:db`
- Валидация медиа-путей: `pnpm validate:media`
- Smoke check: `pnpm smoke`
- Retry pending orders: `pnpm orders:retry-pending`
- Полный predeploy минимум: `pnpm predeploy:check`

## 8) CI/Secrets
Минимальные секреты для CI/monitoring:
- `DATABASE_URL`
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `ADMIN_SESSION_SECRET`
- `MONITOR_BASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `MONITOR_MAX_RESPONSE_MS` (optional)
- `PENDING_ORDERS_BATCH_SIZE` (optional)
- `PENDING_ORDERS_MAX_DELAY_SECONDS` (optional)
