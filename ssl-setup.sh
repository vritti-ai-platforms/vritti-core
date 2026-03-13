#!/usr/bin/env bash
# Vritti local SSL setup for macOS / Linux
# Run with sudo for hosts file modification

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="$SCRIPT_DIR/certs"
HOSTS_FILE="/etc/hosts"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

echo -e "${CYAN}=== Vritti SSL Setup ===${NC}"
echo ""

# 1. Install mkcert if not present
if ! command -v mkcert &>/dev/null; then
    echo -e "${YELLOW}mkcert not found. Installing...${NC}"
    if command -v brew &>/dev/null; then
        brew install mkcert nss
    elif command -v apt-get &>/dev/null; then
        sudo apt-get update && sudo apt-get install -y mkcert libnss3-tools
    elif command -v pacman &>/dev/null; then
        sudo pacman -S mkcert nss
    else
        echo -e "${RED}No supported package manager found. Install mkcert manually: https://github.com/FiloSottile/mkcert${NC}"
        exit 1
    fi

    if ! command -v mkcert &>/dev/null; then
        echo -e "${RED}mkcert installed but not in PATH. Restart your shell and run again.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}mkcert found.${NC}"
fi

# 2. Install local CA (trust store)
echo ""
echo -e "${YELLOW}Installing local CA into trust store...${NC}"
mkcert -install
echo -e "${GREEN}Local CA installed.${NC}"

# 3. Generate certs directly into certs/ directory
mkdir -p "$CERTS_DIR"

echo ""
echo -e "${YELLOW}Generating certificates...${NC}"

pushd "$CERTS_DIR" >/dev/null

# Wildcard cert (used by cloud-server and cloud-web)
mkcert \
    -key-file "_wildcard.local.vrittiai.com+4-key.pem" \
    -cert-file "_wildcard.local.vrittiai.com+4.pem" \
    "*.local.vrittiai.com" \
    "local.vrittiai.com" \
    "localhost" \
    "127.0.0.1" \
    "::1"

# Explicit-domain cert (alternative without wildcard)
mkcert \
    -key-file "local.vrittiai.com+4-key.pem" \
    -cert-file "local.vrittiai.com+4.pem" \
    "local.vrittiai.com" \
    "cloud.local.vrittiai.com" \
    "localhost" \
    "127.0.0.1" \
    "::1"

popd >/dev/null

echo -e "${GREEN}Certificates generated in certs/.${NC}"

# 4. Add hosts entries
echo ""
echo -e "${YELLOW}Checking hosts file entries...${NC}"
DOMAINS=("local.vrittiai.com" "cloud.local.vrittiai.com")

add_host_entry() {
    local domain="$1"
    if grep -q "$domain" "$HOSTS_FILE" 2>/dev/null; then
        echo -e "  ${DIM}Already exists: $domain${NC}"
    else
        if [ -w "$HOSTS_FILE" ]; then
            echo "127.0.0.1		$domain" >> "$HOSTS_FILE"
            echo -e "  ${GREEN}Added: $domain${NC}"
        else
            return 1
        fi
    fi
}

CAN_WRITE=true
for domain in "${DOMAINS[@]}"; do
    if ! add_host_entry "$domain"; then
        CAN_WRITE=false
        break
    fi
done

if [ "$CAN_WRITE" = false ]; then
    echo -e "  ${YELLOW}No write access to $HOSTS_FILE — run with sudo or add manually:${NC}"
    for domain in "${DOMAINS[@]}"; do
        if ! grep -q "$domain" "$HOSTS_FILE" 2>/dev/null; then
            echo "    127.0.0.1		$domain"
        fi
    done
fi

echo ""
echo -e "${CYAN}=== Done! ===${NC}"
echo ""
echo "Next steps:"
echo "  1. Set USE_HTTPS=true in the .env of each service you want to run over HTTPS"
echo "  2. All services must use the same protocol (all HTTP or all HTTPS)"
echo "  3. Start services normally - they will pick up the certs from the root certs/ folder"
echo ""
