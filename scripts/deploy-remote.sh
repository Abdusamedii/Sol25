#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/sol25}"
REPO_URL="${REPO_URL:-https://github.com/Abdusamedii/Sol25.git}"
DEPLOY_PUBLIC_HOST="${DEPLOY_PUBLIC_HOST:?DEPLOY_PUBLIC_HOST is required}"
GIT_REF="${GIT_REF:-main}"
GIT_SHA="${GIT_SHA:-}"
API_IMAGE="${API_IMAGE:-}"
WEB_IMAGE="${WEB_IMAGE:-}"

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

  if [[ -n "${GIT_SHA}" ]]; then
    git reset --hard "${GIT_SHA}"
  else
    git reset --hard "origin/${GIT_REF}"
  fi
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

  printf 'POSTGRES_PASSWORD=%s\n' "${POSTGRES_PASSWORD}"     > .env.production
  printf 'DATABASE_URL=%s\n' "postgres://postgres:${POSTGRES_PASSWORD}@db:5432/sol25" >> .env.production
  printf 'HOST=0.0.0.0\n'                                    >> .env.production
  printf 'PORT=3000\n'                                        >> .env.production
  printf 'NODE_ENV=production\n'                              >> .env.production
  printf 'WEB_ORIGIN=%s\n' "${WEB_ORIGIN}"                   >> .env.production
  printf 'VITE_API_URL=%s\n' "${VITE_API_URL}"               >> .env.production
  printf 'JWT_SECRET=%s\n' "${JWT_SECRET}"                   >> .env.production
  printf 'API_IMAGE=%s\n' "${API_IMAGE}"                     >> .env.production
  printf 'WEB_IMAGE=%s\n' "${WEB_IMAGE}"                     >> .env.production

  chmod 600 .env.production
}

update_env_file() {
  cd "${APP_DIR}"

  if [[ ! -f .env.production ]]; then
    return
  fi

  set_env_value() {
    local key="$1"
    local value="$2"
    if grep -q "^${key}=" .env.production; then
      sed -i "s|^${key}=.*|${key}=${value}|" .env.production
    else
      printf '%s=%s\n' "${key}" "${value}" >> .env.production
    fi
  }

  set_env_value WEB_ORIGIN "${WEB_ORIGIN}"
  set_env_value VITE_API_URL "${VITE_API_URL}"

  if [[ -n "${JWT_SECRET:-}" ]]; then
    set_env_value JWT_SECRET "${JWT_SECRET}"
  fi

  if [[ -n "${API_IMAGE}" ]]; then
    set_env_value API_IMAGE "${API_IMAGE}"
  fi

  if [[ -n "${WEB_IMAGE}" ]]; then
    set_env_value WEB_IMAGE "${WEB_IMAGE}"
  fi
}

ensure_public_ports() {
  if command -v ufw >/dev/null 2>&1; then
    ufw allow OpenSSH >/dev/null 2>&1 || true
    ufw allow 80/tcp  >/dev/null 2>&1 || true
    ufw allow 3000/tcp >/dev/null 2>&1 || true
  fi
}

run_compose() {
  cd "${APP_DIR}"

  if [[ -n "${API_IMAGE}" && -n "${WEB_IMAGE}" ]]; then
    docker compose -f docker-compose.prod.yml --env-file .env.production up -d --remove-orphans --no-build
  else
    docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d --remove-orphans
  fi

  docker image prune -f
}

seed_once() {
  cd "${APP_DIR}"

  if [[ -f .seeded ]]; then
    return
  fi

  echo "Seeding database (first deploy only)..."
  if docker compose -f docker-compose.prod.yml --env-file .env.production \
      run --rm --entrypoint node api apps/api/dist/db/seed.js; then
    touch .seeded
    echo "Seed complete."
  else
    echo "WARNING: seed failed — the app is still running but demo data was not inserted."
    echo "You can seed manually: ssh root@${DEPLOY_PUBLIC_HOST} 'cd /opt/sol25 && docker compose -f docker-compose.prod.yml --env-file .env.production run --rm --entrypoint node api apps/api/dist/db/seed.js && touch .seeded'"
  fi
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
update_env_file
ensure_public_ports
run_compose
seed_once
wait_for_api

echo ""
echo "Deploy complete."
echo "Web:  ${WEB_ORIGIN}"
echo "API:  ${VITE_API_URL}/health"
