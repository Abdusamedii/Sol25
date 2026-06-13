Plan - Inventory & Order Service

What I went with

TanStack Router + TanStack Query: I went with TanStack because routing and server state are separate problems and both need to be handled properly. Router gives me file-based routes and type-safe navigation so I don't end up with broken links or wrong params. Query handles everything that comes from the API - caching so I'm not refetching products on every page visit, automatic retries when a request fails, background refetching to keep stock levels fresh, and cache invalidation after placing an order so the product list updates without a manual refresh. Basically the server state just works and the UI stays in sync.

Fastify: picked this over Express because it's a newer framework built for speed. Less overhead, faster request handling, and the plugin system keeps things organized without much boilerplate. Quick to set up, schema validation hooks in from the start, and it fits well with Zod for typed request/response handling.

PostgreSQL 16: went with a SQL database because this app is all about data integrity and structure. Products have unique SKUs, orders link to line items through foreign keys, stock can't go negative - that stuff needs constraints and transactions, not loose document shapes. Postgres gives me that out of the box plus row locking for the stock decrement problem.

Drizzle: handles migrations from the schema in code so I'm not writing raw SQL by hand every time something changes. drizzle-kit generate and migrate keeps it straightforward. Also makes it easy down the road when I split dev and production databases - same migration files, different connection strings, no drama.

Zod: validation on the API and shared types in packages/shared so frontend and backend agree on the same shapes.

pnpm workspaces: one repo, shared types, easy to run everything together.

Docker Compose: spin up db, api, and web from a clean checkout.

GitHub Actions: lint and test on push.


Repo layout

apps/api: Fastify backend
  src/server.ts: entry point, starts the server
  src/app.ts: wires up plugins, routes, error handling
  src/config/env.ts: reads environment variables
  src/db/: schema, connection, migrations
  src/modules/products/: routes, service, repository for product CRUD
  src/modules/orders/: routes, service, repository for orders and stock logic
  src/plugins/: db connection and cors setup
  src/lib/errors.ts: consistent error responses across the API

apps/web: React frontend
  src/routes/: pages - product list, create order, order confirmation
  src/hooks/: TanStack Query hooks for products and orders
  src/api/client.ts: typed fetch calls to the backend
  src/lib/queryClient.ts: query client config

packages/shared: Zod schemas for products and orders, used by both api and web so types stay in one place

docker-compose.yml: runs postgres, api, and web together
