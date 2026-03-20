#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! git -C "$ROOT_DIR" rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "当前目录不是 git 仓，跳过 pre-commit 卸载。"
  exit 0
fi

current_hooks_path="$(git -C "$ROOT_DIR" config --local --get core.hooksPath 2>/dev/null || true)"

if [ "$current_hooks_path" = ".githooks" ]; then
  git -C "$ROOT_DIR" config --local --unset core.hooksPath
  echo "已移除本仓 core.hooksPath=.githooks。"
  exit 0
fi

echo "当前 core.hooksPath 不是 .githooks，跳过卸载。"
