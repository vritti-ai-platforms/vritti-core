#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAME_FILE="$HERE/../.tunnel"
ORIGIN="https://127.0.0.1:3001"
ZONE="vrittiai.com"

if ! cloudflared tunnel list >/dev/null 2>&1; then
  echo "cloudflared is not authenticated for tunnel management."
  echo "Run:  cloudflared login   (select the ${ZONE} zone), then retry."
  exit 1
fi

if [ ! -f "$NAME_FILE" ]; then
  read -rp "Tunnel subdomain (also the tunnel name, e.g. shashank-dev): " NAME
  [ -n "$NAME" ] || { echo "No name entered."; exit 1; }
  if cloudflared tunnel list --output json | jq -e --arg n "$NAME" 'any(.[]; .name == $n)' >/dev/null 2>&1; then
    echo "Reusing existing tunnel '$NAME'."
  else
    cloudflared tunnel create "$NAME"
  fi
  cloudflared tunnel route dns "$NAME" "$NAME.$ZONE" \
    || echo "route dns failed (see above). If a record for $NAME.$ZONE already exists, rerun: cloudflared tunnel route dns --overwrite-dns $NAME $NAME.$ZONE"
  echo "$NAME" > "$NAME_FILE"
  echo "Saved tunnel name to $NAME_FILE"
fi

NAME="$(cat "$NAME_FILE")"
[ "${1:-}" = "ensure" ] && exit 0

echo "→ https://$NAME.$ZONE  forwards to  $ORIGIN"
exec cloudflared tunnel --no-tls-verify --url "$ORIGIN" run "$NAME"
