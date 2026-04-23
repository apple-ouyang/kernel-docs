#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

bash "$ROOT_DIR/scripts/uninstall-pre-commit.sh"
npx -y skills remove kernel-docs-system kernel-code-to-docs -g -a claude-code -y
bash "$ROOT_DIR/scripts/uninstall-global-bin.sh"
node "$ROOT_DIR/scripts/remove-global-claude-block.mjs"

echo "kernel-docs 已卸载。"
