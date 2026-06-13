FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
COPY . .
RUN pnpm --filter @sol25/shared build
RUN pnpm --filter @sol25/web build

FROM nginx:1.27-alpine AS runner
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
