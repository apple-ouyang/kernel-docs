#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for cmd in node npm npx git; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "缺少命令：$cmd"
    exit 1
  fi
done

if ! "$ROOT_DIR/scripts/ensure-tsx.sh" >/dev/null; then
  exit 1
fi

if ! npx -y skills --help >/dev/null 2>&1; then
  echo "无法调用 npx skills，请先确认 skills CLI 可用"
  exit 1
fi

chmod +x "$ROOT_DIR"/scripts/*.sh
if compgen -G "$ROOT_DIR/scripts/*.ts" >/dev/null; then
  chmod +x "$ROOT_DIR"/scripts/*.ts
fi
chmod +x "$ROOT_DIR"/.githooks/pre-commit
chmod +x "$ROOT_DIR"/skills/kernel-docs-system/scripts/*.ts

echo "环境检查通过。"
echo "可以使用："
echo "  ~/.claude/bin/docs-list /path/to/target-repo"
echo "  ~/.claude/bin/docs-lint /path/to/target-repo"
echo "  ~/.claude/bin/docs-migrate /path/to/target-repo --write"
