#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

bash "$ROOT_DIR/scripts/docs-bootstrap.sh"
bash "$ROOT_DIR/scripts/install-pre-commit.sh"

if npx skills install --help >/dev/null 2>&1; then
  npx skills install "$ROOT_DIR" --full-depth -g -a claude-code -s kernel-docs-system kernel-code-research -y
else
  echo "当前 skills CLI 没有 install 子命令，改用 add。"
  npx skills add "$ROOT_DIR" --full-depth -g -a claude-code -s kernel-docs-system kernel-code-research -y
fi

bash "$ROOT_DIR/scripts/install-global-bin.sh"
tsx "$ROOT_DIR/scripts/sync-global-claude.ts"

echo "文档 Skill 安装完成。"
