#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ "$#" -lt 1 ]; then
  echo "用法：scripts/run-tsx.sh <script-path> [args...]" >&2
  exit 1
fi

TSX_BIN="$("$ROOT_DIR/scripts/ensure-tsx.sh")"
exec "$TSX_BIN" "$@"
