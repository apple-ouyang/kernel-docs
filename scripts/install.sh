#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_NAMES=("kernel-docs-system" "kernel-code-to-docs")

bash "$ROOT_DIR/scripts/docs-bootstrap.sh"
bash "$ROOT_DIR/scripts/install-pre-commit.sh"

install_skill_if_dir_exists() {
  local target_root="$1"
  if [ ! -d "$target_root" ]; then
    return 0
  fi

  local skill_name
  for skill_name in "${SKILL_NAMES[@]}"; do
    local target_dir="${target_root}/${skill_name}"
    mkdir -p "$target_dir"
    cp -R "$ROOT_DIR/skills/${skill_name}/." "$target_dir/"
  done
}

install_skill_if_dir_exists "${HOME}/.claude/skills"
install_skill_if_dir_exists "${HOME}/.agents/skills"
install_skill_if_dir_exists "${HOME}/.opencode/skills"

bash "$ROOT_DIR/scripts/install-global-bin.sh"
bash "$ROOT_DIR/scripts/run-tsx.sh" "$ROOT_DIR/scripts/sync-global-claude.ts"

echo "文档 Skill 安装完成。"
