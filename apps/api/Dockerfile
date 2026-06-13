FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app
COPY . .
RUN pnpm --filter @sol25/shared build
RUN pnpm --filter @sol25/api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV MIGRATIONS_FOLDER=apps/api/src/db/migrations
RUN corepack enable
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/src/db/migrations ./apps/api/src/db/migrations
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
EXPOSE 3000
CMD ["sh", "-c", "node apps/api/dist/db/migrate.js && node apps/api/dist/db/seed.js && node apps/api/dist/server.js"]
