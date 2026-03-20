#!/usr/bin/env bash
set -euo pipefail

CLAUDE_DIR="${HOME}/.claude"
BIN_DIR="${CLAUDE_DIR}/bin"
ENV_PATH="${CLAUDE_DIR}/kernel-docs.env"

remove_path() {
  local path="$1"

  if [ ! -e "$path" ] && [ ! -L "$path" ]; then
    return 0
  fi

  if command -v trash >/dev/null 2>&1; then
    trash "$path"
    return 0
  fi

  rm -rf "$path"
}

remove_path "$ENV_PATH"
remove_path "${BIN_DIR}/docs-list"
remove_path "${BIN_DIR}/docs-lint"
remove_path "${BIN_DIR}/docs-migrate"

echo "已移除全局 docs 命令和环境文件。"
