#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_NAMES=("kernel-docs-system" "kernel-code-to-docs")

remove_skill_if_present() {
  local target_root="$1"
  local skill_name
  for skill_name in "${SKILL_NAMES[@]}"; do
    local target_dir="${target_root}/${skill_name}"
    if [ ! -e "$target_dir" ]; then
      continue
    fi

    if command -v trash >/dev/null 2>&1; then
      trash "$target_dir"
    else
      rm -rf "$target_dir"
    fi
  done
}

bash "$ROOT_DIR/scripts/uninstall-pre-commit.sh"
remove_skill_if_present "${HOME}/.claude/skills"
remove_skill_if_present "${HOME}/.agents/skills"
remove_skill_if_present "${HOME}/.opencode/skills"
bash "$ROOT_DIR/scripts/uninstall-global-bin.sh"
node "$ROOT_DIR/scripts/remove-global-claude-block.mjs"

echo "kernel-docs 已卸载。"
