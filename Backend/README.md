# CashCompass Backend API

RESTful API backend for CashCompass Expense Tracker & Budget Management application, built with **NestJS**, **PostgreSQL**, **Prisma ORM**, and **Docker**.

---

## Tech Stack

- **Framework:** NestJS 12 (TypeScript, ESM)
- **Database:** PostgreSQL 16
- **ORM:** Prisma 6
- **Authentication:** JWT (Passport, Bcrypt)
- **Validation:** Class Validator & Class Transformer
- **Documentation:** OpenAPI / Swagger
- **Containerization:** Docker & Docker Compose

---

## Directory Structure

```
Backend/
├── prisma/
│   └── schema.prisma        # Database models & relations
├── src/
│   ├── analytics/           # Home & chart summary analytics
│   ├── auth/                # JWT authentication, guards & strategies
│   ├── budgets/             # Budget limits & real-time checking
│   ├── notifications/       # In-app notifications
│   ├── prisma/              # Global Prisma service
│   ├── transactions/        # Incomes, Expenses, Transfers
│   ├── users/               # User profiles & preferences
│   ├── app.module.ts
│   └── main.ts              # Entry point with Swagger & CORS
├── Dockerfile               # Production multi-stage Docker build
├── docker-compose.yml       # PostgreSQL + API orchestration
├── package.json
└── .env.example
```

---

## Quick Start with Docker

The fastest way to spin up both PostgreSQL and the NestJS API:

1. **Copy the environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Start the containers**:
   ```bash
   docker compose up --build -d
   ```

3. **Run database migration**:
   ```bash
   docker compose exec api npx prisma db push
   ```

4. **Access the API**:
   - Base URL: `http://localhost:3000/api`
   - Interactive Swagger API Docs: `http://localhost:3000/api/docs`

---

## Running Locally (Development Mode)

If you have a local PostgreSQL instance running or want to run NestJS directly on your machine:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start PostgreSQL with Docker (DB only)**:
   ```bash
   docker compose up -d postgres
   ```

3. **Generate Prisma Client & Push Schema**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start NestJS in watch mode**:
   ```bash
   npm run start:dev
   ```

5. **Prisma Studio (GUI Database Browser)**:
   ```bash
   npx prisma studio
   ```

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login with email & password (returns JWT) | No |
| `GET` | `/api/auth/me` | Get currently authenticated user profile | Bearer JWT |
| `POST` | `/api/auth/forgot-password` | Request password reset instructions | No |

### Users & Profile (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users/profile` | Get user profile details | Bearer JWT |
| `PUT` | `/api/users/profile` | Update profile (name, bio, country, currency) | Bearer JWT |

### Transactions (`/api/transactions`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/transactions` | Create a transaction (Income, Expense, Transfer) | Bearer JWT |
| `GET` | `/api/transactions` | Get transactions (filters: type, category, date range, min/max amount) | Bearer JWT |
| `GET` | `/api/transactions/:id` | Get transaction details by ID | Bearer JWT |
| `PUT` | `/api/transactions/:id` | Update an existing transaction | Bearer JWT |
| `DELETE` | `/api/transactions/:id` | Delete a transaction | Bearer JWT |

### Budgets (`/api/budgets`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/budgets` | Create a budget goal (Daily, Weekly, Monthly, Yearly, Specified Date) | Bearer JWT |
| `GET` | `/api/budgets` | List budgets (optional `period` filter) | Bearer JWT |
| `POST` | `/api/budgets/check` | Real-time budget limit calculation & warning | Bearer JWT |
| `DELETE` | `/api/budgets/:id` | Delete a budget goal | Bearer JWT |

### Notifications (`/api/notifications`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/notifications` | Get user notifications list | Bearer JWT |
| `POST` | `/api/notifications` | Create a notification (e.g. budget warning) | Bearer JWT |
| `PATCH` | `/api/notifications/:id/read` | Mark a notification as read | Bearer JWT |
| `DELETE` | `/api/notifications/:id` | Delete a notification | Bearer JWT |
| `DELETE` | `/api/notifications` | Clear all user notifications | Bearer JWT |

### Analytics (`/api/analytics`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/analytics/home` | Summary totals (balance, income, expense), period & recent items | Bearer JWT |
| `GET` | `/api/analytics/charts` | Aggregated transaction data for charts | Bearer JWT |
