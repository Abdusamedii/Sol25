# Product Inventory & Order Management

Full-stack take-home implementation for a small product inventory and order service.

## Stack

- Frontend: React, Vite, TanStack Router, TanStack Query
- Backend: Fastify, TypeScript, Zod validation, Drizzle ORM
- Database: PostgreSQL
- Tooling: pnpm workspaces, Vitest, Docker Compose

## Run with Docker

```bash
docker compose up --build
```

The app will be available at:

- Web: `http://localhost:5173`
- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

The API container runs migrations before starting.

## Local Development

```bash
pnpm install
cp .env.example .env
docker compose up db
pnpm db:migrate
pnpm dev
```

Useful commands:

```bash
pnpm build
pnpm check
pnpm test
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## Project Structure

```text
apps/api
  src/app.ts
  src/server.ts
  src/db
  src/modules/products
  src/modules/orders

apps/web
  src/routes
  src/api
  src/hooks

packages/shared
  src/product.ts
  src/order.ts
```

The API keeps routing, service logic, and data access separate. The frontend keeps server state behind TanStack Query hooks and uses TanStack Router file-based routes. Shared Zod schemas define API payloads and inferred TypeScript types once.

## API

- `GET /health`
- `GET /products`
- `POST /products`
- `GET /products/:id`
- `PUT /products/:id`
- `DELETE /products/:id`
- `GET /orders`
- `POST /orders`

Error responses use this shape:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Insufficient stock",
    "details": {}
  }
}
```

## Database Choice

PostgreSQL is a natural fit for this domain because products, orders, and order items have clear relationships and integrity rules. Foreign keys, unique constraints, check constraints, and transactions are core requirements rather than optional conveniences here.

The schema includes:

- `products`: unique SKU, positive price, non-negative stock
- `orders`: persisted total and status
- `order_items`: quantity, unit price at time of purchase, foreign keys to orders and products

## Concurrency Strategy

Order creation is handled in one database transaction. The service:

1. Groups duplicate product IDs from the request.
2. Locks all requested product rows using PostgreSQL row locks through Drizzle's `for('update')`.
3. Validates stock while rows are locked.
4. Inserts the order and line items.
5. Decrements stock before the transaction commits.

That means two concurrent orders for the last unit cannot both read the same available stock and both succeed.

## Tests

The backend includes Vitest coverage for product creation/listing and order stock behavior. Tests expect a PostgreSQL database configured through `DATABASE_URL`.

```bash
docker compose up db
pnpm db:migrate
pnpm --filter @sol25/api test
```

## What I Would Do With More Time

- Add `GET /orders/:id` and have the confirmation page fetch persisted order details directly.
- Add pagination and category/SKU filtering to product listing.
- Add seed data for local demo startup.
- Add authentication or API keys for write endpoints.
- Add more concurrency tests that issue parallel order requests against the same stock.
- Add OpenAPI generation and Swagger UI from the Fastify Zod schemas.
