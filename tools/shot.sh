#!/bin/bash
# Screenshot a render.html query with headless Chrome.
#   tools/shot.sh out.png "figs=daruma,gama&page=1" [width] [height]
OUT="$1"; Q="$2"; W="${3:-1400}"; H="${4:-1000}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROFILE="$(mktemp -d)"
rm -f "$OUT"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-sandbox --disable-gpu \
  --no-first-run --no-default-browser-check --allow-file-access-from-files --user-data-dir="$PROFILE" \
  --virtual-time-budget=5000 --screenshot="$OUT" --window-size="$W,$H" \
  "file://$DIR/tools/render.html?$Q" >/dev/null 2>&1 &
PID=$!
for i in $(seq 1 40); do [ -s "$OUT" ] && break; sleep 0.5; done
sleep 0.5; kill $PID 2>/dev/null; wait $PID 2>/dev/null; rm -rf "$PROFILE" 2>/dev/null
[ -s "$OUT" ] && echo "wrote $OUT" || { echo "screenshot failed"; exit 1; }
