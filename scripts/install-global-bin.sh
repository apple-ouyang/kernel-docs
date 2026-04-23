#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLAUDE_DIR="${HOME}/.claude"
BIN_DIR="${CLAUDE_DIR}/bin"
ENV_PATH="${CLAUDE_DIR}/kernel-docs.env"

mkdir -p "$BIN_DIR"

if [ -e "${BIN_DIR}/docs-migrate" ] || [ -L "${BIN_DIR}/docs-migrate" ]; then
  rm -f "${BIN_DIR}/docs-migrate"
fi

cat >"$ENV_PATH" <<EOF
KERNEL_DOCS_REPO="${ROOT_DIR}"
KERNEL_DOCS_DEFAULT_DOCS_REPO="${HOME}/kernel-docs"
EOF

install_wrapper() {
  local name="$1"
  local target="$2"

  cat >"${BIN_DIR}/${name}" <<EOF
#!/usr/bin/env bash
set -euo pipefail
source "\$HOME/.claude/kernel-docs.env"
args=( "\$@" )
if [ "\${#args[@]}" -eq 0 ]; then
  args=( "\$KERNEL_DOCS_DEFAULT_DOCS_REPO" )
elif [[ "\${args[0]}" == -* ]]; then
  args=( "\$KERNEL_DOCS_DEFAULT_DOCS_REPO" "\${args[@]}" )
fi
exec "\$KERNEL_DOCS_REPO/scripts/run-tsx.sh" "\$KERNEL_DOCS_REPO/scripts/${target}" "\${args[@]}"
EOF

  chmod +x "${BIN_DIR}/${name}"
}

install_wrapper "docs-list" "docs-list.ts"
install_wrapper "docs-lint" "docs-lint.ts"
install_wrapper "docs-init-frontmatter" "docs-init-frontmatter.ts"

echo "已安装全局命令到 ${BIN_DIR}"
