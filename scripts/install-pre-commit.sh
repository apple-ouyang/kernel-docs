#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! git -C "$ROOT_DIR" rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "当前目录还不是 git 仓，请先执行 git init"
  exit 1
fi

git -C "$ROOT_DIR" config core.hooksPath .githooks
echo "已启用本地 pre-commit：.githooks/pre-commit"
