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

export DEPLOY_PUBLIC_HOST="${DROPLET_IP}"
export POSTGRES_PASSWORD
export JWT_SECRET
export REPO_URL
export APP_DIR

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

if [[ ! -d "${APP_DIR}/.git" ]]; then
  git clone "${REPO_URL}" "${APP_DIR}"
fi

cd "${APP_DIR}"
git pull --ff-only

chmod +x scripts/deploy-remote.sh
scripts/deploy-remote.sh

echo ""
echo "Manual bootstrap complete."
echo "Configure GitHub Actions secrets for automated deploys:"
echo "  SSH_HOST, SSH_USER, SSH_PRIVATE_KEY, SSH_PASSPHRASE"
echo "  DEPLOY_PUBLIC_HOST, POSTGRES_PASSWORD, JWT_SECRET"
