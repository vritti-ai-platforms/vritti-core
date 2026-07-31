#!/usr/bin/env bash
set -uo pipefail

# Bootstraps the LOCAL Gitea for core-server, mirroring what the Go agent does for real
# deployments: bring up the container, create the admin user, mint an all-scopes API token,
# and write GITEA_BASE_URL (shared) + GITEA_ADMIN_TOKEN (personal, per-dev) into Infisical
# `local` /core-server. Idempotent: skips the token mint if one is already set.
#
# Every Infisical/Gitea call reports its own failure. Swallowing them with `>/dev/null 2>&1`
# leaves the placeholder token in Infisical and no clue which step broke.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$HERE/.." && pwd)"
CONTAINER="vritti-core-gitea"
BASE_URL="http://localhost:3020"
ADMIN_USER="admin"
ADMIN_PASS="Vritti@0322"
PLACEHOLDER="__set_per_dev__"
INF_ARGS=(--env=local --path=/core-server --silent)

# The Infisical CLI resolves the project from .infisical.json in the working directory, so run
# from the app root regardless of where the caller invoked this script.
cd "$APP_DIR" || { echo "cannot cd to ${APP_DIR}" >&2; exit 1; }
[ -f .infisical.json ] || { echo "no .infisical.json in ${APP_DIR}" >&2; exit 1; }

die() { echo "==> FAILED: $*" >&2; exit 1; }

# secrets set, surfacing the CLI's own error text instead of silence.
inf_set() { # inf_set <shared|personal> <KEY=VALUE> <key-name-for-messages>
  local type="$1" pair="$2" name="$3" out
  if ! out="$(infisical secrets set "$pair" --type="$type" "${INF_ARGS[@]}" 2>&1)"; then
    printf '%s\n' "$out" | sed 's/^/    /' >&2
    die "infisical secrets set ${name} (type=${type})"
  fi
}

# secrets get. A missing key exits 0 with empty output, so emptiness is the "unset" signal.
inf_get() { # inf_get <key> [extra flags, e.g. --secret-overriding=false]
  infisical secrets get "$1" "${INF_ARGS[@]}" --plain "${@:2}" 2>/dev/null
}

echo "==> starting local Gitea"
docker compose -f "${APP_DIR}/local-db-compose.yml" up -d gitea >/dev/null \
  || die "docker compose up gitea (is Docker running?)"

echo "==> waiting for Gitea on ${BASE_URL}"
for i in $(seq 1 60); do
  if curl -sf -o /dev/null "${BASE_URL}/api/healthz"; then break; fi
  [ "$i" = "60" ] && die "Gitea did not become ready. Check: docker logs ${CONTAINER}"
  sleep 2
done

echo "==> ensuring admin user '${ADMIN_USER}'"
CREATE_OUT="$(docker exec -u git "$CONTAINER" gitea admin user create \
  --admin --username "$ADMIN_USER" --password "$ADMIN_PASS" \
  --email "${ADMIN_USER}@vritti.local" --must-change-password=false 2>&1)"
CREATE_RC=$?
printf '%s\n' "$CREATE_OUT" | sed 's/^/    /'
# "already exists" is the normal re-run path; any other failure is real.
if [ "$CREATE_RC" -ne 0 ] && ! printf '%s' "$CREATE_OUT" | grep -qi 'already exist'; then
  die "gitea admin user create (exit ${CREATE_RC})"
fi

inf_set shared "GITEA_BASE_URL=${BASE_URL}" GITEA_BASE_URL
echo "==> set GITEA_BASE_URL (local, shared) = ${BASE_URL}"

EXISTING="$(inf_get GITEA_ADMIN_TOKEN)"
if [ -n "$EXISTING" ] && [ "$EXISTING" != "$PLACEHOLDER" ] && [ "${#EXISTING}" -gt 20 ]; then
  echo "==> GITEA_ADMIN_TOKEN already set; skipping mint (delete it in Infisical to re-mint)"
  echo "==> local Gitea ready at ${BASE_URL} (restart core to pick up the token)"
  exit 0
fi

echo "==> minting admin API token"
MINT_OUT="$(docker exec -u git "$CONTAINER" gitea admin user generate-access-token \
  --username "$ADMIN_USER" --scopes all --token-name "core-$(date +%s)" --raw 2>&1)"
TOKEN="$(printf '%s' "$MINT_OUT" | tail -1 | tr -d '[:space:]')"
# A `--raw` token is one long opaque string. Anything with punctuation or spaces is an error
# message that `tail -1` happened to catch — a length check alone would store it as a token.
if ! printf '%s' "$TOKEN" | grep -Eq '^[A-Za-z0-9_-]{30,}$'; then
  printf '%s\n' "$MINT_OUT" | sed 's/^/    /' >&2
  die "token mint did not return a token"
fi

# A personal override needs a shared key of the same name to attach to. Ask for the SHARED
# value specifically — a plain get would report an existing personal override instead.
if [ -z "$(inf_get GITEA_ADMIN_TOKEN --secret-overriding=false)" ]; then
  inf_set shared "GITEA_ADMIN_TOKEN=${PLACEHOLDER}" GITEA_ADMIN_TOKEN
  echo "==> seeded shared GITEA_ADMIN_TOKEN placeholder"
fi

# Write the override, then confirm what `infisical run` will actually inject — a set that
# reports success while the placeholder survives is exactly the failure the old script hid.
# The retry covers an override landing before its freshly-created shared key is visible.
READBACK=""
for attempt in 1 2; do
  inf_set personal "GITEA_ADMIN_TOKEN=${TOKEN}" GITEA_ADMIN_TOKEN
  READBACK="$(inf_get GITEA_ADMIN_TOKEN)"
  [ "$READBACK" = "$TOKEN" ] && break
  [ "$attempt" = "1" ] && { echo "    override not visible yet; retrying"; sleep 2; }
done
if [ "$READBACK" != "$TOKEN" ]; then
  if [ "$READBACK" = "$PLACEHOLDER" ]; then
    die "personal override did not take — GITEA_ADMIN_TOKEN still reads as ${PLACEHOLDER}"
  fi
  die "GITEA_ADMIN_TOKEN read back as an unexpected value (${#READBACK} chars)"
fi
echo "==> set GITEA_ADMIN_TOKEN (local, personal override) = ${TOKEN:0:6}… (${#TOKEN} chars)"

echo "==> local Gitea ready at ${BASE_URL} (restart core to pick up the token)"
