# ZLAGODA — АІС супермаркету

Навчальний проєкт: автоматизована інформаційна система для мережі супермаркетів «Zlagoda». Система автоматизує повсякденні операції каси та управління торговою точкою: облік товарів, категорій, цін, продажів, постійних клієнтів та персоналу.

## Навіщо

Проєкт виконано відповідно до ТЗ «АІС Супермаркет»:

- двоє ролей користувачів — **Менеджер** і **Касир** — з різними правами;
- повний CRUD для працівників, категорій, товарів каталогу, товарів на складі, карток постійних клієнтів, чеків;
- касовий модуль: формування чека, автоматичний розрахунок суми й ПДВ, застосування знижки за карткою клієнта;
- формування та друк зведених звітів по всіх сутностях;
- реалізовані функціональні вимоги (пошук, фільтрація, сортування, обмеження за роллю тощо).

## Технології

| Шар      | Стек                                                             |
| -------- | ---------------------------------------------------------------- |
| Backend  | NestJS 10 + TypeORM (raw queries) + PostgreSQL + JWT             |
| Frontend | React 18 + TypeScript + React Router + Zustand + Axios           |
| Auth     | JWT (access-токен у localStorage, `JwtAuthGuard` + `RolesGuard`) |

## Структура репозиторію

```
Zlagoda/
├── backend-nest/       # NestJS API (порт 8000)
│   └── src/
│       ├── auth/              # логін, JWT, Guard-и ролей
│       ├── users/             # працівники
│       ├── products/
│       │   ├── categories/        # категорії товарів
│       │   ├── products/          # каталог товарів
│       │   └── store-products/    # товари на складі (UPC)
│       ├── customer-cards/    # картки постійних клієнтів
│       ├── check/             # чеки + позиції продажу (Sale)
│       ├── reports/           # агреговані запити для звітів
│       └── database/          # підключення + авто-створення схеми
└── frontend/           # React SPA (порт 3000)
    └── src/
        ├── Dashboard.tsx / NavBar.tsx
        ├── Users.tsx / CustomerCards.tsx
        ├── Catalog.tsx / Categories.tsx / StoreProducts.tsx
        ├── Cashier.tsx / Reports.tsx / Profile.tsx
        ├── services/          # обгортки над axios по модулях
        ├── store/             # Zustand store-и (user, product, sales)
        └── components/        # спільні компоненти (SortableTh, UserRow…)
```

## База даних

Схема створюється автоматично при старті бекенду (`SchemaInitService` виконує `CREATE TABLE IF NOT EXISTS …`). СКБД — **PostgreSQL**. Модель із 7 таблиць (ER-модель з ТЗ, 6 сутностей + проміжна `Sale`).

| Таблиця         | Призначення                                              | Ключ                                                            |
| --------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| `Category`      | Категорії товарів                                        | `category_number` (SERIAL)                                      |
| `Product`       | Каталог товарів (назва, виробник, характеристики)        | `id_product` (SERIAL), FK → Category                            |
| `Employee`      | Працівники (менеджер/касир), адреса, зарплата, email+хеш | `id_employee` (VARCHAR 10)                                      |
| `Store_Product` | Позиція товару на складі (UPC, ціна, к-сть, акція)       | `UPC` (VARCHAR 12), FK → Product, self-FK на акційний UPC       |
| `Customer_Card` | Постійні клієнти (ПІБ, телефон, адреса, % знижки)        | `card_number` (VARCHAR 13)                                      |
| `Check`         | Чек (касир, опц. картка, дата, сума, ПДВ)                | `check_number` (VARCHAR 10), FK → Employee, Customer_Card       |
| `Sale`          | Позиція чека (UPC, к-сть, ціна на момент продажу)        | Композитний PK `(UPC, check_number)`, FK → Store_Product, Check |

### Обмеження з ТЗ, реалізовані на рівні БД

- `Employee.empl_role ∈ {'Manager','Cashier'}`, зарплата ≥ 0, вік ≥ 18 років, телефон ≤ 13 символів і починається з `+`.
- `Customer_Card.percent` у діапазоні 0–100, телефон з `+`.
- `Store_Product.products_number ≥ 0`, `selling_price ≥ 0`.
- `Check.sum_total ≥ 0`, `vat ≥ 0`. `vat = sum_total * 0.2` розраховується в сервісі.
- `Sale.product_number > 0`; при видаленні чека позиції каскадно видаляються.

### Ролі

- **Manager** — повний доступ: CRUD для всіх сутностей, доступ до розширених звітів, видалення карток і чеків.
- **Cashier** — обмежений доступ: CRUD карток (крім видалення), створення чеків (власна каса), бачить власні чеки.

## Запуск (dev)

### Вимоги

- Node.js ≥ 18
- PostgreSQL ≥ 13 (локально або віддалено — головне, щоб був `DATABASE_URL`)

### 1. Backend (NestJS)

```bash
cd backend-nest
npm i
npm run start:dev
```

Бекенд підніметься на `http://127.0.0.1:8000`.

Swagger `http://127.0.0.1:8000/docs`.

### 2. Frontend (React)

В окремому терміналі:

```bash
cd frontend
npm i
npm run start
```

Фронтенд підніметься на `http://localhost:3000` і звертається до бекенду за `http://127.0.0.1:8000`.

## .env файли

Перед першим запуском створіть `.env` файли — без них бекенд не стартоне.

### `backend-nest/.env`

```env
# Рядок підключення до PostgreSQL (обовʼязково)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/zlagoda

# Секрет для підпису JWT (обовʼязково для production, dev має fallback 'dev-secret')
SECRET_KEY=change-me-to-a-long-random-string
```

> Примітка: при першому підключенні сервіс `SchemaInitService` сам створить усі таблиці в цій БД. База повинна існувати заздалегідь (`CREATE DATABASE zlagoda;`).

### `frontend/.env`

Фронтенд наразі використовує захардкоджений `baseURL = http://127.0.0.1:8000` (`frontend/src/shared/api/api.ts`). Якщо адреса бекенду інша — правити прямо в цьому файлі. Окремий `.env` для фронтенду не потрібен.

## Початковий користувач

Щоб отримати першого менеджера, зареєструйте його через ендпоінт `POST /register` (публічний). Приклад:

```bash
curl -X POST http://127.0.0.1:8000/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@zlagoda.ua",
    "password": "password123",
    "empl_surname": "Іванов",
    "empl_name": "Іван",
    "empl_patronymic": "Іванович",
    "empl_role": "Manager",
    "empl_salary": 25000,
    "date_of_birth": "1990-01-01",
    "date_of_start": "2024-01-01",
    "phone_number": "+380501234567",
    "city": "Київ",
    "street": "Хрещатик 1",
    "zip_code": "01001"
  }'
```

Після цього заходьте на `http://localhost:3000` і логіньтесь цим email/password.
