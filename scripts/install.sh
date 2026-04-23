#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_NAMES=("kernel-docs-system" "kernel-code-to-docs")
STABLE_REPO_LINK="${HOME}/kernel-docs"

canonical_dir() {
  (
    cd "$1" >/dev/null 2>&1
    pwd -P
  )
}

ensure_stable_repo_link() {
  local root_realpath
  root_realpath="$(canonical_dir "$ROOT_DIR")"

  if [ ! -e "$STABLE_REPO_LINK" ] && [ ! -L "$STABLE_REPO_LINK" ]; then
    ln -s "$ROOT_DIR" "$STABLE_REPO_LINK"
    echo "已创建稳定入口：${STABLE_REPO_LINK} -> ${ROOT_DIR}"
    return 0
  fi

  if [ -e "$STABLE_REPO_LINK" ] && [ "$(canonical_dir "$STABLE_REPO_LINK")" = "$root_realpath" ]; then
    echo "稳定入口已就绪：${STABLE_REPO_LINK}"
    return 0
  fi

  if [ -L "$STABLE_REPO_LINK" ]; then
    rm "$STABLE_REPO_LINK"
    ln -s "$ROOT_DIR" "$STABLE_REPO_LINK"
    echo "已更新稳定入口：${STABLE_REPO_LINK} -> ${ROOT_DIR}"
    return 0
  fi

  echo "警告：${STABLE_REPO_LINK} 已存在且不指向当前仓库，跳过稳定入口创建。" >&2
}

bash "$ROOT_DIR/scripts/docs-bootstrap.sh"
bash "$ROOT_DIR/scripts/install-pre-commit.sh"
ensure_stable_repo_link

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
