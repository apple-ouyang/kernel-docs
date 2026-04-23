import test from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  readlinkSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(THIS_DIR, "..");
const DOCS_BOOTSTRAP = join(REPO_ROOT, "scripts", "docs-bootstrap.sh");
const INSTALL_GLOBAL_BIN = join(REPO_ROOT, "scripts", "install-global-bin.sh");
const INSTALL_SH = join(REPO_ROOT, "scripts", "install.sh");
const UNINSTALL_PRE_COMMIT = join(REPO_ROOT, "scripts", "uninstall-pre-commit.sh");
const UNINSTALL_SH = join(REPO_ROOT, "scripts", "uninstall.sh");
const REAL_BASH = which("bash");
const REAL_NODE = process.execPath;
const REAL_TSX = which("tsx");

function which(cmd) {
  const result = spawnSync("which", [cmd], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || `缺少命令：${cmd}`);
  return result.stdout.trim();
}

function withTempHome(setup) {
  const homeDir = mkdtempSync(join(tmpdir(), "kernel-docs-runtime-"));
  try {
    setup(homeDir);
  } finally {
    rmSync(homeDir, { recursive: true, force: true });
  }
}

function writeExecutable(path, content) {
  writeFileSync(path, content, "utf8");
  chmodSync(path, 0o755);
}

function createFakeBin(homeDir, options = {}) {
  const binDir = mkdtempSync(join(homeDir, "bin-"));

  symlinkSync(REAL_BASH, join(binDir, "bash"));
  symlinkSync(REAL_NODE, join(binDir, "node"));

  writeExecutable(
    join(binDir, "git"),
    options.gitScript ??
      `#!/usr/bin/env bash
set -euo pipefail
exit 0
`
  );

  if (options.includeTsx) {
    writeExecutable(
      join(binDir, "tsx"),
      `#!/usr/bin/env bash
set -euo pipefail
exec "${REAL_TSX}" "$@"
`
    );
  }

  writeExecutable(
    join(binDir, "npx"),
    options.npxScript ??
      `#!/usr/bin/env bash
set -euo pipefail
exit 0
`
  );

  writeExecutable(
    join(binDir, "npm"),
    options.npmScript ??
      `#!/usr/bin/env bash
set -euo pipefail
exit 0
`
  );

  return binDir;
}

function run(cmd, args, options = {}) {
  return spawnSync(cmd, args, {
    encoding: "utf8",
    env: {
      ...process.env,
      ...options.env,
    },
  });
}

function scopedPath(binDir) {
  return `${binDir}:/usr/bin:/bin`;
}

test("docs-bootstrap 在缺少全局 tsx 时自动安装到用户目录", () => {
  withTempHome((homeDir) => {
    const npmLogPath = join(homeDir, "npm.log");
    const binDir = createFakeBin(homeDir, {
      npmScript: `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$FAKE_NPM_LOG"
if [ "$#" -eq 3 ] && [ "$1" = "install" ] && [ "$2" = "-g" ] && [ "$3" = "tsx" ]; then
  exit 1
fi
if [ "$#" -eq 5 ] && [ "$1" = "install" ] && [ "$2" = "-g" ] && [ "$3" = "--prefix" ] && [ "$5" = "tsx" ]; then
  PREFIX="$4"
  mkdir -p "$PREFIX/bin"
  cat > "$PREFIX/bin/tsx" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec "$REAL_TSX_PATH" "$@"
EOF
  chmod +x "$PREFIX/bin/tsx"
  exit 0
fi
echo "unexpected npm args: $*" >&2
exit 92
`,
    });

    const result = run("bash", [DOCS_BOOTSTRAP], {
      env: {
        HOME: homeDir,
        PATH: scopedPath(binDir),
        FAKE_NPM_LOG: npmLogPath,
        REAL_TSX_PATH: REAL_TSX,
      },
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(join(homeDir, ".claude", "tools", "tsx", "bin", "tsx")), true);
    assert.match(result.stdout, /~\/\.claude\/bin\/docs-list/);
    assert.match(result.stdout, /~\/\.claude\/bin\/docs-lint/);
    assert.match(result.stdout, /~\/\.claude\/bin\/docs-migrate --write/);
    assert.doesNotMatch(result.stdout, /npm run docs:/);

    const npmLog = readFileSync(npmLogPath, "utf8");
    assert.match(npmLog, /^install -g tsx$/m);
    assert.match(npmLog, /install -g --prefix .*\/\.claude\/tools\/tsx tsx/);
  });
});

test("install-global-bin 生成的 wrapper 在缺少全局 tsx 时仍可执行", () => {
  withTempHome((homeDir) => {
    const npmLogPath = join(homeDir, "npm.log");
    const installBin = createFakeBin(homeDir, {
      includeTsx: true,
    });
    const installResult = run("bash", [INSTALL_GLOBAL_BIN], {
      env: {
        HOME: homeDir,
        PATH: scopedPath(installBin),
      },
    });
    assert.equal(installResult.status, 0, installResult.stderr);

    const runBin = createFakeBin(homeDir, {
      npxScript: `#!/usr/bin/env bash
set -euo pipefail
exit 0
`,
      npmScript: `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$FAKE_NPM_LOG"
if [ "$#" -eq 3 ] && [ "$1" = "install" ] && [ "$2" = "-g" ] && [ "$3" = "tsx" ]; then
  exit 1
fi
if [ "$#" -eq 5 ] && [ "$1" = "install" ] && [ "$2" = "-g" ] && [ "$3" = "--prefix" ] && [ "$5" = "tsx" ]; then
  PREFIX="$4"
  mkdir -p "$PREFIX/bin"
  cat > "$PREFIX/bin/tsx" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec "$REAL_TSX_PATH" "$@"
EOF
  chmod +x "$PREFIX/bin/tsx"
  exit 0
fi
echo "unexpected npm args: $*" >&2
exit 93
`,
    });

    const wrapperPath = join(homeDir, ".claude", "bin", "docs-list");
    const result = run("bash", [wrapperPath, REPO_ROOT], {
      env: {
        HOME: homeDir,
        PATH: scopedPath(runBin),
        FAKE_NPM_LOG: npmLogPath,
        REAL_TSX_PATH: REAL_TSX,
      },
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Docs root:/);
  });
});

test("install.sh 仅在运行时目录存在时覆盖复制两个 skill", () => {
  withTempHome((homeDir) => {
    mkdirSync(join(homeDir, ".claude", "skills"), { recursive: true });
    mkdirSync(join(homeDir, ".agents", "skills"), { recursive: true });
    mkdirSync(join(homeDir, ".opencode", "skills"), { recursive: true });

    mkdirSync(join(homeDir, ".claude", "skills", "kernel-docs-system"), { recursive: true });
    writeFileSync(
      join(homeDir, ".claude", "skills", "kernel-docs-system", "stale.txt"),
      "stale",
      "utf8"
    );

    const binDir = createFakeBin(homeDir, {
      includeTsx: true,
    });

    const result = run("bash", [INSTALL_SH], {
      env: {
        HOME: homeDir,
        PATH: scopedPath(binDir),
      },
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(lstatSync(join(homeDir, "kernel-docs")).isSymbolicLink(), true);
    assert.equal(readlinkSync(join(homeDir, "kernel-docs")), REPO_ROOT);

    assert.equal(existsSync(join(homeDir, ".claude", "skills", "kernel-docs-system", "SKILL.md")), true);
    assert.equal(existsSync(join(homeDir, ".claude", "skills", "kernel-code-to-docs", "SKILL.md")), true);
    assert.equal(existsSync(join(homeDir, ".agents", "skills", "kernel-docs-system", "SKILL.md")), true);
    assert.equal(existsSync(join(homeDir, ".agents", "skills", "kernel-code-to-docs", "SKILL.md")), true);
    assert.equal(existsSync(join(homeDir, ".opencode", "skills", "kernel-docs-system", "SKILL.md")), true);
    assert.equal(existsSync(join(homeDir, ".opencode", "skills", "kernel-code-to-docs", "SKILL.md")), true);
    assert.equal(readFileSync(join(homeDir, ".claude", "skills", "kernel-docs-system", "stale.txt"), "utf8"), "stale");
  });
});

test("install.sh 在稳定入口已存在普通目录时跳过软链接创建", () => {
  withTempHome((homeDir) => {
    mkdirSync(join(homeDir, "kernel-docs"), { recursive: true });

    const binDir = createFakeBin(homeDir, {
      includeTsx: true,
    });

    const result = run("bash", [INSTALL_SH], {
      env: {
        HOME: homeDir,
        PATH: scopedPath(binDir),
      },
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(lstatSync(join(homeDir, "kernel-docs")).isDirectory(), true);
    assert.match(result.stderr, /已存在且不指向当前仓库，跳过稳定入口创建/);
  });
});

test("install.sh 会跳过不存在的运行时目录", () => {
  withTempHome((homeDir) => {
    mkdirSync(join(homeDir, ".opencode", "skills"), { recursive: true });

    const binDir = createFakeBin(homeDir, {
      includeTsx: true,
    });

    const result = run("bash", [INSTALL_SH], {
      env: {
        HOME: homeDir,
        PATH: scopedPath(binDir),
      },
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(join(homeDir, ".claude", "skills", "kernel-docs-system", "SKILL.md")), false);
    assert.equal(existsSync(join(homeDir, ".claude", "skills", "kernel-code-to-docs", "SKILL.md")), false);
    assert.equal(existsSync(join(homeDir, ".agents", "skills", "kernel-docs-system", "SKILL.md")), false);
    assert.equal(existsSync(join(homeDir, ".agents", "skills", "kernel-code-to-docs", "SKILL.md")), false);
    assert.equal(existsSync(join(homeDir, ".opencode", "skills", "kernel-docs-system", "SKILL.md")), true);
    assert.equal(existsSync(join(homeDir, ".opencode", "skills", "kernel-code-to-docs", "SKILL.md")), true);
  });
});

test("uninstall-pre-commit 仅在 hooksPath 为 .githooks 时撤销", () => {
  withTempHome((homeDir) => {
    const gitLogPath = join(homeDir, "git.log");
    const binDir = createFakeBin(homeDir, {
      gitScript: `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$FAKE_GIT_LOG"
if [ "$#" -ge 3 ] && [ "$3" = "rev-parse" ]; then
  exit 0
fi
if [ "$#" -ge 6 ] && [ "$3" = "config" ] && [ "$4" = "--local" ] && [ "$5" = "--get" ] && [ "$6" = "core.hooksPath" ]; then
  printf '.githooks\\n'
  exit 0
fi
if [ "$#" -ge 6 ] && [ "$3" = "config" ] && [ "$4" = "--local" ] && [ "$5" = "--unset" ] && [ "$6" = "core.hooksPath" ]; then
  exit 0
fi
echo "unexpected git args: $*" >&2
exit 95
`,
    });

    const result = run("bash", [UNINSTALL_PRE_COMMIT], {
      env: {
        HOME: homeDir,
        PATH: scopedPath(binDir),
        FAKE_GIT_LOG: gitLogPath,
      },
    });

    assert.equal(result.status, 0, result.stderr);

    const gitLog = readFileSync(gitLogPath, "utf8");
    assert.match(gitLog, /config --local --get core\.hooksPath/);
    assert.match(gitLog, /config --local --unset core\.hooksPath/);
  });
});

test("uninstall.sh 清理复制到运行时目录的 skill 并移除全局安装痕迹", () => {
  withTempHome((homeDir) => {
    const gitLogPath = join(homeDir, "git.log");
    const claudeDir = join(homeDir, ".claude");
    mkdirSync(join(claudeDir, "bin"), { recursive: true });
    mkdirSync(join(claudeDir, "skills", "kernel-docs-system"), { recursive: true });
    mkdirSync(join(claudeDir, "skills", "kernel-code-to-docs"), { recursive: true });
    mkdirSync(join(homeDir, ".agents", "skills", "kernel-docs-system"), { recursive: true });
    mkdirSync(join(homeDir, ".agents", "skills", "kernel-code-to-docs"), { recursive: true });
    mkdirSync(join(homeDir, ".opencode", "skills", "kernel-docs-system"), { recursive: true });
    mkdirSync(join(homeDir, ".opencode", "skills", "kernel-code-to-docs"), { recursive: true });
    symlinkSync(REPO_ROOT, join(homeDir, "kernel-docs"));
    writeFileSync(join(claudeDir, "kernel-docs.env"), 'KERNEL_DOCS_REPO="/tmp/kernel-docs"\n', "utf8");
    writeFileSync(join(claudeDir, "bin", "docs-list"), "#!/usr/bin/env bash\n", "utf8");
    writeFileSync(join(claudeDir, "bin", "docs-lint"), "#!/usr/bin/env bash\n", "utf8");
    writeFileSync(join(claudeDir, "bin", "docs-migrate"), "#!/usr/bin/env bash\n", "utf8");
    writeFileSync(
      join(claudeDir, "CLAUDE.md"),
      `# 全局指令

## 文档系统

- 自定义规则

<!-- kernel-docs:managed:start -->
### Docs（由 kernel-docs 安装脚本维护）

- 当前 kernel-docs 安装源：\`/tmp/kernel-docs\`
<!-- kernel-docs:managed:end -->
`,
      "utf8"
    );

    const binDir = createFakeBin(homeDir, {
      gitScript: `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$FAKE_GIT_LOG"
if [ "$#" -ge 3 ] && [ "$3" = "rev-parse" ]; then
  exit 0
fi
if [ "$#" -ge 6 ] && [ "$3" = "config" ] && [ "$4" = "--local" ] && [ "$5" = "--get" ] && [ "$6" = "core.hooksPath" ]; then
  printf '.githooks\\n'
  exit 0
fi
if [ "$#" -ge 6 ] && [ "$3" = "config" ] && [ "$4" = "--local" ] && [ "$5" = "--unset" ] && [ "$6" = "core.hooksPath" ]; then
  exit 0
fi
echo "unexpected git args: $*" >&2
exit 97
`,
    });

    const result = run("bash", [UNINSTALL_SH], {
      env: {
        HOME: homeDir,
        PATH: scopedPath(binDir),
        FAKE_GIT_LOG: gitLogPath,
      },
    });

    assert.equal(result.status, 0, result.stderr);

    assert.equal(existsSync(join(claudeDir, "skills", "kernel-docs-system")), false);
    assert.equal(existsSync(join(claudeDir, "skills", "kernel-code-to-docs")), false);
    assert.equal(existsSync(join(homeDir, ".agents", "skills", "kernel-docs-system")), false);
    assert.equal(existsSync(join(homeDir, ".agents", "skills", "kernel-code-to-docs")), false);
    assert.equal(existsSync(join(homeDir, ".opencode", "skills", "kernel-docs-system")), false);
    assert.equal(existsSync(join(homeDir, ".opencode", "skills", "kernel-code-to-docs")), false);
    assert.equal(existsSync(join(homeDir, "kernel-docs")), false);
    assert.equal(existsSync(join(claudeDir, "kernel-docs.env")), false);
    assert.equal(existsSync(join(claudeDir, "bin", "docs-list")), false);
    assert.equal(existsSync(join(claudeDir, "bin", "docs-lint")), false);
    assert.equal(existsSync(join(claudeDir, "bin", "docs-migrate")), false);

    const claudeContent = readFileSync(join(claudeDir, "CLAUDE.md"), "utf8");
    assert.doesNotMatch(claudeContent, /kernel-docs:managed:start/);

    const gitLog = readFileSync(gitLogPath, "utf8");
    assert.match(gitLog, /config --local --unset core\.hooksPath/);
  });
});

test("仓根 AGENTS.md 软链接到 CLAUDE.md", () => {
  const agentsPath = join(REPO_ROOT, "AGENTS.md");
  const stats = lstatSync(agentsPath);

  assert.equal(stats.isSymbolicLink(), true);
  assert.equal(readlinkSync(agentsPath), "CLAUDE.md");
});
