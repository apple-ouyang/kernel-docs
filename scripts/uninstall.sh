#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

bash "$ROOT_DIR/scripts/uninstall-pre-commit.sh"
npx -y skills remove -g -a claude-code kernel-docs-system kernel-code-research -y
bash "$ROOT_DIR/scripts/uninstall-global-bin.sh"
node "$ROOT_DIR/scripts/remove-global-claude-block.mjs"

echo "kernel-docs 已卸载。"
