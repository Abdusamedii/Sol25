#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/sol25}"
REPO_URL="${REPO_URL:-https://github.com/Abdusamedii/Sol25.git}"
DEPLOY_PUBLIC_HOST="${DEPLOY_PUBLIC_HOST:?DEPLOY_PUBLIC_HOST is required}"
GIT_REF="${GIT_REF:-main}"

WEB_ORIGIN="http://${DEPLOY_PUBLIC_HOST}"
VITE_API_URL="http://${DEPLOY_PUBLIC_HOST}:3000"

ensure_docker() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    return
  fi

  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
}

ensure_repo() {
  if [[ ! -d "${APP_DIR}/.git" ]]; then
    mkdir -p "${APP_DIR}"
    git clone "${REPO_URL}" "${APP_DIR}"
  fi

  cd "${APP_DIR}"
  git fetch origin "${GIT_REF}"
  git reset --hard "origin/${GIT_REF}"
}

ensure_env_file() {
  cd "${APP_DIR}"

  if [[ -f .env.production ]]; then
    return
  fi

  if [[ -z "${POSTGRES_PASSWORD:-}" || -z "${JWT_SECRET:-}" ]]; then
    echo "Missing POSTGRES_PASSWORD or JWT_SECRET for first deploy."
    exit 1
  fi

  cat > .env.production <<EOF
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
DATABASE_URL=postgres://postgres:${POSTGRES_PASSWORD}@db:5432/sol25
HOST=0.0.0.0
PORT=3000
NODE_ENV=production
WEB_ORIGIN=${WEB_ORIGIN}
VITE_API_URL=${VITE_API_URL}
JWT_SECRET=${JWT_SECRET}
EOF
}

update_public_urls() {
  cd "${APP_DIR}"

  if [[ ! -f .env.production ]]; then
    return
  fi

  grep -q '^WEB_ORIGIN=' .env.production && sed -i "s|^WEB_ORIGIN=.*|WEB_ORIGIN=${WEB_ORIGIN}|" .env.production
  grep -q '^VITE_API_URL=' .env.production && sed -i "s|^VITE_API_URL=.*|VITE_API_URL=${VITE_API_URL}|" .env.production
}

run_compose() {
  cd "${APP_DIR}"
  docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d --remove-orphans
  docker image prune -f
}

seed_once() {
  cd "${APP_DIR}"

  if [[ -f .seeded ]]; then
    return
  fi

  echo "Seeding database (first deploy only)..."
  docker compose -f docker-compose.prod.yml --env-file .env.production run --rm --entrypoint node api apps/api/dist/db/seed.js
  touch .seeded
}

wait_for_api() {
  local attempts=30
  local delay=5

  for ((i = 1; i <= attempts; i++)); do
    if curl -fsS "${VITE_API_URL}/health" >/dev/null 2>&1; then
      echo "API is healthy."
      return
    fi

    echo "Waiting for API (${i}/${attempts})..."
    sleep "${delay}"
  done

  echo "API health check failed."
  docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail 50 api || true
  exit 1
}

ensure_docker
ensure_repo
ensure_env_file
update_public_urls
run_compose
seed_once
wait_for_api

echo ""
echo "Deploy complete."
echo "Web:  ${WEB_ORIGIN}"
echo "API:  ${VITE_API_URL}/health"
