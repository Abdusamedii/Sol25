#!/usr/bin/env bash
set -euo pipefail

KEY_PATH="${1:-$HOME/.ssh/sol25_deploy}"
DROPLET_IP="${DROPLET_IP:-68.183.78.175}"
SSH_USER="${SSH_USER:-root}"

if [[ -f "${KEY_PATH}" ]]; then
  echo "Key already exists: ${KEY_PATH}"
  echo "Delete it first or pass a different path."
  exit 1
fi

ssh-keygen -t ed25519 -f "${KEY_PATH}" -N "" -C "sol25-github-actions-deploy"

echo ""
echo "Deploy key created (no passphrase): ${KEY_PATH}"
echo ""
echo "1. Add the public key to your droplet:"
echo ""
echo "   ssh-copy-id -i ${KEY_PATH}.pub ${SSH_USER}@${DROPLET_IP}"
echo ""
echo "   Or paste this line into /root/.ssh/authorized_keys on the droplet:"
echo ""
cat "${KEY_PATH}.pub"
echo ""
echo "2. Set GitHub secrets (from repo root):"
echo ""
echo "   gh secret set SSH_HOST --body '${DROPLET_IP}'"
echo "   gh secret set SSH_USER --body '${SSH_USER}'"
echo "   gh secret set SSH_PRIVATE_KEY < '${KEY_PATH}'"
echo "   gh secret delete SSH_PASSPHRASE"
echo "   gh secret set DEPLOY_PUBLIC_HOST --body '${DROPLET_IP}'"
echo ""
echo "3. Set POSTGRES_PASSWORD and JWT_SECRET if not already configured:"
echo ""
echo "   gh secret set POSTGRES_PASSWORD --body \"\$(openssl rand -hex 16)\""
echo "   gh secret set JWT_SECRET --body \"\$(openssl rand -hex 32)\""
