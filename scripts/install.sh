#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPENCODE_SKILLS_DIR="${HOME}/.opencode/skills"

bash "$ROOT_DIR/scripts/docs-bootstrap.sh"
bash "$ROOT_DIR/scripts/install-pre-commit.sh"

if ! npx -y skills --help >/dev/null 2>&1; then
  echo "无法调用 npx skills，请先确认 skills CLI 可用"
  exit 1
fi

npx -y skills add "$ROOT_DIR" --full-depth -g -a claude-code -s kernel-docs-system kernel-code-to-docs -y
npx -y skills add "$ROOT_DIR" --full-depth -g -a opencode -s kernel-docs-system kernel-code-to-docs -y

if [ -d "$OPENCODE_SKILLS_DIR" ]; then
  # OpenCode 运行时目录已存在时，再补一份物理拷贝，避免 host 安装状态不同步。
  cp -R "$ROOT_DIR/skills/kernel-docs-system" "$OPENCODE_SKILLS_DIR/"
  cp -R "$ROOT_DIR/skills/kernel-code-to-docs" "$OPENCODE_SKILLS_DIR/"
fi

bash "$ROOT_DIR/scripts/install-global-bin.sh"
bash "$ROOT_DIR/scripts/run-tsx.sh" "$ROOT_DIR/scripts/sync-global-claude.ts"

echo "文档 Skill 安装完成。"
