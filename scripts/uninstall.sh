#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_NAMES=("kernel-docs-system" "kernel-code-to-docs")
STABLE_REPO_LINK="${HOME}/kernel-docs"

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

remove_stable_repo_link_if_managed() {
  if [ ! -L "$STABLE_REPO_LINK" ]; then
    return 0
  fi

  if [ ! -e "$STABLE_REPO_LINK" ]; then
    if command -v trash >/dev/null 2>&1; then
      trash "$STABLE_REPO_LINK"
    else
      rm "$STABLE_REPO_LINK"
    fi
    return 0
  fi

  local link_realpath
  local root_realpath
  link_realpath="$(
    cd "$STABLE_REPO_LINK" >/dev/null 2>&1
    pwd -P
  )"
  root_realpath="$(
    cd "$ROOT_DIR" >/dev/null 2>&1
    pwd -P
  )"

  if [ "$link_realpath" != "$root_realpath" ]; then
    return 0
  fi

  if command -v trash >/dev/null 2>&1; then
    trash "$STABLE_REPO_LINK"
  else
    rm "$STABLE_REPO_LINK"
  fi
}

bash "$ROOT_DIR/scripts/uninstall-pre-commit.sh"
remove_skill_if_present "${HOME}/.claude/skills"
remove_skill_if_present "${HOME}/.agents/skills"
remove_skill_if_present "${HOME}/.opencode/skills"
bash "$ROOT_DIR/scripts/uninstall-global-bin.sh"
node "$ROOT_DIR/scripts/remove-global-claude-block.mjs"
remove_stable_repo_link_if_managed

echo "kernel-docs 已卸载。"
