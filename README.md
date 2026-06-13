# Product Inventory & Order Management

Full-stack product inventory and order service with a customer storefront, cart checkout, and admin dashboard.

## Live Demo

| Service | URL |
|---|---|
| **Web app** | http://68.183.78.175 |
| **API health** | http://68.183.78.175:3000/health |

### Demo accounts

| Role | Username | Password | Access |
|---|---|---|---|
| Customer | `customer` | `customer` | Browse catalog, cart, checkout |
| Admin | `admin` | `admin` | Admin dashboard (products & orders) |

Admins are redirected away from the storefront and cannot place orders.

---

## Stack

- **Frontend:** React, Vite, TanStack Router, TanStack Query, Tailwind CSS
- **Backend:** Fastify, TypeScript, Zod, Drizzle ORM, JWT auth
- **Database:** PostgreSQL
- **Tooling:** pnpm workspaces, Vitest, Docker Compose, GitHub Actions

---

## Run locally

### Quick start (Docker — one command)

Requires [Docker](https://docs.docker.com/get-docker/) only.

```bash
docker compose up --build
```

On first boot the API runs migrations and seeds demo users plus 10,000 products. Subsequent restarts skip seeding.

| Service | URL |
|---|---|
| Web | http://localhost:5173 |
| API | http://localhost:3000 |
| PostgreSQL | localhost:5432 |

Sign in with `customer` / `customer` or `admin` / `admin` (see [Demo accounts](#demo-accounts) above).

Stop and remove containers:

```bash
docker compose down
```

Reset the database and re-seed from scratch:

```bash
docker compose down -v
docker compose up --build
```

### Development (hot reload)

**Prerequisites:** Node.js 22+, pnpm 10, Docker

```bash
pnpm install
cp .env.example .env
docker compose up db
pnpm db:migrate
pnpm db:seed
pnpm dev
```

| Service | URL |
|---|---|
| Web | http://localhost:5173 |
| API | http://localhost:3000 |

### Useful commands

```bash
pnpm build          # build all packages
pnpm check          # typecheck all packages
pnpm test           # run tests
pnpm db:migrate     # apply migrations
pnpm db:seed        # seed demo users and products
pnpm db:studio      # open Drizzle Studio
```

---

## Project structure

```text
apps/api          Fastify API (products, orders, auth)
apps/web          React storefront + admin dashboard
packages/shared   Shared Zod schemas and TypeScript types
```

The API separates routing, service logic, and data access. The frontend keeps server state in TanStack Query hooks and uses file-based TanStack Router routes. Shared Zod schemas define request/response shapes once.

---

## API

### Public

- `GET /health`

### Auth

- `POST /auth/signup`
- `POST /auth/signin`
- `GET /auth/me` (authenticated)

### Products

- `GET /products` — list with search, filters, pagination
- `GET /products/:id`
- `POST /products` (admin)
- `PUT /products/:id` (admin)
- `DELETE /products/:id` (admin)

### Orders

- `GET /orders` (admin)
- `GET /orders/:id` (owner or admin)
- `POST /orders` (customer checkout — shipping address + payment in one step)

Payment simulation declines card numbers ending in `0000` with HTTP 402. Stock is decremented atomically inside the order transaction.

Error responses:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Insufficient stock",
    "details": {}
  }
}
```

---

## Production deployment

Production runs on a DigitalOcean droplet via GitHub Actions:

1. **CI** runs on every push (typecheck, lint, tests).
2. **Deploy** runs after CI passes on `main` — builds Docker images, uploads them over SSH, and starts the stack with `docker-compose.prod.yml`.

| Port | Service |
|---|---|
| 80 | Web (nginx) |
| 3000 | API |

Required GitHub secrets: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `DEPLOY_PUBLIC_HOST`, `POSTGRES_PASSWORD`, `JWT_SECRET`.

Manual first-time bootstrap on the server:

```bash
bash scripts/deploy-droplet.sh
```

Generate a CI deploy key:

```bash
bash scripts/generate-deploy-key.sh
```

---

## Database

PostgreSQL stores products, orders, order items, and users. The schema enforces unique SKUs, non-negative stock, and foreign keys between orders and products.

Order creation runs in a single transaction:

1. Lock requested product rows (`SELECT … FOR UPDATE`)
2. Validate stock under the lock
3. Insert order and line items
4. Decrement stock
5. Commit

Concurrent orders for the last unit cannot both succeed.

---

## Tests

Backend tests use Vitest against PostgreSQL:

```bash
docker compose up db
pnpm db:migrate
pnpm test
```

CI also creates a separate `sol25_test` database and runs migrations before tests.

### Concurrency tests

Order concurrency is covered in `apps/api/src/modules/orders/orders.concurrency.test.ts`. Each test spins up separate database connections and fires simultaneous checkout attempts against the same product, simulating two or more customers buying at the same time.

Run only the concurrency suite:

```bash
docker compose up db
DATABASE_URL=postgres://postgres:postgres@localhost:5432/sol25_test pnpm db:migrate
pnpm --filter @sol25/api exec vitest run src/modules/orders/orders.concurrency.test.ts
```

Scenarios covered:

| Scenario | Stock | Buyers | Result |
|---|---|---|---|
| Last unit race | 1 | 2 × qty 1 | Exactly 1 order succeeds, 1 gets `409 Insufficient stock`, stock ends at 0 |
| Enough stock | 2 | 2 × qty 1 | Both orders succeed, stock ends at 0 |
| Over-request | 1 | 2 × qty 2 | Both rejected, stock unchanged, no orders created |
| Three-way race | 2 | 3 × qty 1 | 2 succeed, 1 rejected, stock ends at 0 |
| Double submit | 1 | Same customer, 2 × qty 1 | 1 succeeds, 1 rejected, stock ends at 0 |
| Partial stock use | 3 | 2 × qty 2 | 1 succeeds, 1 rejected, stock ends at 1 |
| Load test | 5 | 8 × qty 1 | 5 succeed, 3 rejected, stock never goes below 0 |

These tests assert PostgreSQL row locking prevents overselling when the first buyer takes the last available unit before the second transaction completes.
