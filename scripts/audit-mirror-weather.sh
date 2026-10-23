#!/usr/bin/env bash
# Run on a machine on the same LAN as the mirror (e.g. archimedes).
set -euo pipefail

MIRROR_HOST="${MIRROR_HOST:-192.168.1.16}"
MIRROR_USER="${MIRROR_USER:-pi}"

echo "=== Reachability: ${MIRROR_USER}@${MIRROR_HOST} ==="
ping -c 1 -W 2 "${MIRROR_HOST}" >/dev/null 2>&1 && echo "ping: ok" || echo "ping: failed (ICMP may be blocked)"
curl -sS -m 5 -o /dev/null -w "http://%{http_code}\n" "http://${MIRROR_HOST}:8080/" || echo "http://:8080 failed"

echo ""
echo "=== ~/.ssh/config hosts ==="
[ -f "${HOME}/.ssh/config" ] && grep -E '^(Host |  HostName |  User )' "${HOME}/.ssh/config" || echo "(none)"

echo ""
echo "=== Remote audit ==="
ssh -o ConnectTimeout=8 -o BatchMode=yes "${MIRROR_USER}@${MIRROR_HOST}" 'bash -s' <<'REMOTE'
set -e
CONFIG="$HOME/MagicMirror/config/config.js"
if [ ! -f "$CONFIG" ]; then
  echo "Missing $CONFIG"
  exit 1
fi
echo "-- MagicMirror version --"
cd "$HOME/MagicMirror" && git describe --tags --always 2>/dev/null || true
echo ""
echo "-- module blocks (weather / MMM-ShortsOrJacket) --"
grep -n 'module: "weather"\|module: "MMM-ShortsOrJacket"\|weatherProvider\|type:\|lat:\|lon:\|apiKey' "$CONFIG" | sed -E 's/(apiKey": ")[^"]{8,}(")/\1****\2/'
echo ""
if [ -d "$HOME/MagicMirror/modules/MMM-ShortsOrJacket/.git" ]; then
  echo "-- MMM-ShortsOrJacket --"
  cd "$HOME/MagicMirror/modules/MMM-ShortsOrJacket" && git log -1 --oneline
else
  echo "MMM-ShortsOrJacket not installed"
fi
REMOTE
