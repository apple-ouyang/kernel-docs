#!/usr/bin/env bash
set -euo pipefail

if [ -z "${HOME:-}" ]; then
  echo "缺少 HOME 环境变量，无法确定 tsx 的用户安装目录" >&2
  exit 1
fi

USER_TSX_PREFIX="${HOME}/.claude/tools/tsx"
USER_TSX_BIN="${USER_TSX_PREFIX}/bin/tsx"

resolve_path_tsx() {
  if command -v tsx >/dev/null 2>&1; then
    command -v tsx
    return 0
  fi
  return 1
}

resolve_global_prefix_tsx() {
  local global_prefix=""
  global_prefix="$(npm prefix -g 2>/dev/null || true)"
  if [ -n "$global_prefix" ] && [ -x "${global_prefix}/bin/tsx" ]; then
    printf '%s\n' "${global_prefix}/bin/tsx"
    return 0
  fi
  return 1
}

if tsx_path="$(resolve_path_tsx)"; then
  printf '%s\n' "$tsx_path"
  exit 0
fi

if [ -x "$USER_TSX_BIN" ]; then
  printf '%s\n' "$USER_TSX_BIN"
  exit 0
fi

echo "未检测到 tsx，先尝试 npm 全局安装。" >&2
if npm install -g tsx 1>&2; then
  if tsx_path="$(resolve_path_tsx)"; then
    printf '%s\n' "$tsx_path"
    exit 0
  fi

  if tsx_path="$(resolve_global_prefix_tsx)"; then
    printf '%s\n' "$tsx_path"
    exit 0
  fi
fi

echo "全局安装 tsx 失败，回退到用户目录安装。" >&2
mkdir -p "$USER_TSX_PREFIX"
if npm install -g --prefix "$USER_TSX_PREFIX" tsx 1>&2 && [ -x "$USER_TSX_BIN" ]; then
  printf '%s\n' "$USER_TSX_BIN"
  exit 0
fi

cat >&2 <<EOF
自动安装 tsx 失败，请手工执行下面任意一条命令后重试：
  npm install -g tsx
  npm install -g --prefix "$USER_TSX_PREFIX" tsx
EOF
exit 1
