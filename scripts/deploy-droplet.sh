#!/usr/bin/env bash
set -euo pipefail

DROPLET_IP="${DROPLET_IP:-68.183.78.175}"
REPO_URL="${REPO_URL:-https://github.com/Abdusamedii/Sol25.git}"
APP_DIR="${APP_DIR:-/opt/sol25}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(openssl rand -hex 16)}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash scripts/deploy-droplet.sh"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

if ! docker compose version >/dev/null 2>&1; then
  apt-get update
  apt-get install -y git curl
  curl -fsSL https://get.docker.com | sh
fi

if [[ ! -d "${APP_DIR}/.git" ]]; then
  git clone "${REPO_URL}" "${APP_DIR}"
fi

cd "${APP_DIR}"
git pull --ff-only

cat > .env.production <<EOF
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
DATABASE_URL=postgres://postgres:${POSTGRES_PASSWORD}@db:5432/sol25
HOST=0.0.0.0
PORT=3000
NODE_ENV=production
WEB_ORIGIN=http://${DROPLET_IP}
VITE_API_URL=http://${DROPLET_IP}:3000
JWT_SECRET=${JWT_SECRET}
EOF

docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d

if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH || ufw allow 22
  ufw allow 80/tcp
  ufw allow 3000/tcp
  ufw --force enable || true
fi

echo ""
echo "Deployed."
echo "Web:  http://${DROPLET_IP}"
echo "API:  http://${DROPLET_IP}:3000/health"
echo "Demo: customer/customer, admin/admin"
echo ""
echo "First API start runs migrations + seeds 10k products (may take a few minutes)."
