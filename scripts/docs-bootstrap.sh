#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for cmd in node npm git; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "缺少命令：$cmd"
    exit 1
  fi
done

if ! "$ROOT_DIR/scripts/ensure-tsx.sh" >/dev/null; then
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
echo "  ~/.claude/bin/docs-list"
echo "  ~/.claude/bin/docs-lint"
echo "  ~/.claude/bin/docs-init-frontmatter --write"
