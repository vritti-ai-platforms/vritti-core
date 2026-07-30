#!/usr/bin/env bash
set -uo pipefail

# Bootstraps the LOCAL Gitea for core-server, mirroring what the Go agent does for real
# deployments: bring up the container, create the admin user, mint an all-scopes API token,
# and write GITEA_BASE_URL (shared) + GITEA_ADMIN_TOKEN (personal, per-dev) into Infisical
# `local` /core-server. Idempotent: skips the token mint if one is already set.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTAINER="vritti-core-gitea"
BASE_URL="http://localhost:3020"
ADMIN_USER="admin"
ADMIN_PASS="Vritti@0322"

echo "==> starting local Gitea"
docker compose -f "$HERE/../local-db-compose.yml" up -d gitea >/dev/null

echo "==> waiting for Gitea on ${BASE_URL}"
for i in $(seq 1 60); do
  if curl -sf -o /dev/null "${BASE_URL}/api/healthz"; then break; fi
  [ "$i" = "60" ] && { echo "Gitea did not become ready. Check: docker logs ${CONTAINER}"; exit 1; }
  sleep 2
done

echo "==> ensuring admin user '${ADMIN_USER}'"
docker exec -u git "$CONTAINER" gitea admin user create \
  --admin --username "$ADMIN_USER" --password "$ADMIN_PASS" \
  --email "${ADMIN_USER}@vritti.local" --must-change-password=false 2>&1 | sed 's/^/    /' || true

infisical secrets set "GITEA_BASE_URL=${BASE_URL}" --type=shared --env=local --path=/core-server --silent >/dev/null 2>&1 \
  && echo "==> set GITEA_BASE_URL (local) = ${BASE_URL}"

EXISTING="$(infisical secrets get GITEA_ADMIN_TOKEN --env=local --path=/core-server --plain --silent 2>/dev/null)"
if [ -n "$EXISTING" ] && [ "$EXISTING" != "__set_per_dev__" ] && [ "${#EXISTING}" -gt 20 ]; then
  echo "==> GITEA_ADMIN_TOKEN already set; skipping mint (delete it in Infisical to re-mint)"
else
  echo "==> minting admin API token"
  TOKEN="$(docker exec -u git "$CONTAINER" gitea admin user generate-access-token \
    --username "$ADMIN_USER" --scopes all --token-name "core-$(date +%s)" --raw 2>&1 | tail -1 | tr -d '[:space:]')"
  if [ "${#TOKEN}" -lt 20 ]; then echo "    token mint failed: ${TOKEN}"; exit 1; fi
  # A personal override needs a shared key to attach to — seed a placeholder if none exists.
  if [ -z "$EXISTING" ]; then
    infisical secrets set "GITEA_ADMIN_TOKEN=__set_per_dev__" --type=shared --env=local --path=/core-server --silent >/dev/null 2>&1
  fi
  infisical secrets set "GITEA_ADMIN_TOKEN=${TOKEN}" --type=personal --env=local --path=/core-server --silent >/dev/null 2>&1 \
    && echo "==> set GITEA_ADMIN_TOKEN (local, personal override)"
fi

echo "==> local Gitea ready at ${BASE_URL} (restart core to pick up the token)"
