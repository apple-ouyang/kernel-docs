import test from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
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
      npxScript: `#!/usr/bin/env bash
set -euo pipefail
if [ "$#" -ge 3 ] && [ "$1" = "-y" ] && [ "$2" = "skills" ] && [ "$3" = "--help" ]; then
  exit 0
fi
echo "unexpected npx args: $*" >&2
exit 91
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
    assert.match(result.stdout, /~\/\.claude\/bin\/docs-list \/path\/to\/target-repo/);
    assert.match(result.stdout, /~\/\.claude\/bin\/docs-lint \/path\/to\/target-repo/);
    assert.match(result.stdout, /~\/\.claude\/bin\/docs-migrate \/path\/to\/target-repo --write/);
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

test("install.sh 非交互调用 skills add", () => {
  withTempHome((homeDir) => {
    const npxLogPath = join(homeDir, "npx.log");
    const binDir = createFakeBin(homeDir, {
      includeTsx: true,
      npxScript: `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$FAKE_NPX_LOG"
if [ "$#" -ge 3 ] && [ "$1" = "-y" ] && [ "$2" = "skills" ] && [ "$3" = "--help" ]; then
  exit 0
fi
if [ "$#" -ge 4 ] && [ "$1" = "-y" ] && [ "$2" = "skills" ] && [ "$3" = "add" ]; then
  exit 0
fi
echo "unexpected npx args: $*" >&2
exit 94
`,
    });

    const result = run("bash", [INSTALL_SH], {
      env: {
        HOME: homeDir,
        PATH: scopedPath(binDir),
        FAKE_NPX_LOG: npxLogPath,
      },
    });

    assert.equal(result.status, 0, result.stderr);

    const npxLog = readFileSync(npxLogPath, "utf8");
    assert.match(npxLog, /^-y skills --help$/m);
    assert.match(npxLog, /-y skills add .* -g -a claude-code .* -y/);
    assert.doesNotMatch(npxLog, /^skills --help$/m);
  });
});
