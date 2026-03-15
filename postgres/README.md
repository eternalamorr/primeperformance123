# PostgreSQL Bootstrap (no Supabase)

Этот набор можно накатить на любой PostgreSQL 16/17/18 (Timeweb, Yandex, локально в Docker).

## Что внутри
- `init.sql` — полная инициализация схемы + функции + стартовые данные.

## Как запустить (когда арендуешь БД)

```bash
psql "postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require" -f postgres/init.sql
```

Если `sslmode=require` не нужен (локальная БД), можно так:

```bash
psql "postgresql://USER:PASSWORD@HOST:PORT/DB" -f postgres/init.sql
```

## Проверка

```sql
select count(*) from products;
select count(*) from product_extras;
select count(*) from admin_users;
```

Ожидаемо после `init.sql`:
- `products`: 9
- `product_extras`: 3
- `admin_users`: 1 (неактивный placeholder)

## Важно
- В `admin_users.password_hash` стоит `REPLACE_WITH_HASH`.
- После запуска сгенерируй хеш и активируй админа через приложение/скрипт.
