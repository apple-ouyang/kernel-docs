import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(THIS_DIR, "..");
const INSTALL_GLOBAL_BIN = join(REPO_ROOT, "scripts", "install-global-bin.sh");
const SYNC_GLOBAL_CLAUDE = join(REPO_ROOT, "scripts", "sync-global-claude.ts");

function withTempHome(setup) {
  const homeDir = mkdtempSync(join(tmpdir(), "kernel-docs-home-"));
  try {
    setup(homeDir);
  } finally {
    rmSync(homeDir, { recursive: true, force: true });
  }
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

test("install-global-bin 安装全局 wrapper 并记录当前仓路径", () => {
  withTempHome((homeDir) => {
    const result = run("bash", [INSTALL_GLOBAL_BIN], {
      env: { HOME: homeDir },
    });

    assert.equal(result.status, 0, result.stderr);

    const envPath = join(homeDir, ".claude", "kernel-docs.env");
    const docsListPath = join(homeDir, ".claude", "bin", "docs-list");
    const docsLintPath = join(homeDir, ".claude", "bin", "docs-lint");
    const docsMigratePath = join(homeDir, ".claude", "bin", "docs-migrate");

    assert.equal(existsSync(envPath), true);
    assert.equal(existsSync(docsListPath), true);
    assert.equal(existsSync(docsLintPath), true);
    assert.equal(existsSync(docsMigratePath), true);

    const envContent = readFileSync(envPath, "utf8");
    assert.match(envContent, /KERNEL_DOCS_REPO=".*\/kernel-docs"/);

    const wrapperContent = readFileSync(docsListPath, "utf8");
    assert.match(wrapperContent, /source "\$HOME\/\.claude\/kernel-docs\.env"/);
    assert.match(wrapperContent, /exec tsx "\$KERNEL_DOCS_REPO\/scripts\/docs-list\.ts" "\$@"/);
    assert.ok((statSync(docsListPath).mode & 0o111) !== 0, "wrapper 应该可执行");
  });
});

test("sync-global-claude 在文档系统小节后插入受管区块", () => {
  withTempHome((homeDir) => {
    const claudeDir = join(homeDir, ".claude");
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(
      join(claudeDir, "CLAUDE.md"),
      `# 全局指令

## 文档系统

- 旧规则
`,
      "utf8"
    );

    const result = run("tsx", [SYNC_GLOBAL_CLAUDE], {
      env: {
        HOME: homeDir,
        KERNEL_DOCS_REPO: "/tmp/kernel-docs-a",
      },
    });

    assert.equal(result.status, 0, result.stderr);

    const content = readFileSync(join(claudeDir, "CLAUDE.md"), "utf8");
    assert.match(content, /<!-- kernel-docs:managed:start -->/);
    assert.match(content, /必须使用 `~\/\.claude\/bin\/docs-list` 命令列出当前有哪些文档可以参考/);
    assert.match(content, /当前 kernel-docs 安装源：`\/tmp\/kernel-docs-a`/);
  });
});

test("sync-global-claude 重复执行时更新路径且不重复插入", () => {
  withTempHome((homeDir) => {
    const claudeDir = join(homeDir, ".claude");
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(
      join(claudeDir, "CLAUDE.md"),
      `# 全局指令

## 文档系统

- 旧规则
`,
      "utf8"
    );

    const first = run("tsx", [SYNC_GLOBAL_CLAUDE], {
      env: {
        HOME: homeDir,
        KERNEL_DOCS_REPO: "/tmp/kernel-docs-a",
      },
    });
    assert.equal(first.status, 0, first.stderr);

    const second = run("tsx", [SYNC_GLOBAL_CLAUDE], {
      env: {
        HOME: homeDir,
        KERNEL_DOCS_REPO: "/tmp/kernel-docs-b",
      },
    });
    assert.equal(second.status, 0, second.stderr);

    const content = readFileSync(join(claudeDir, "CLAUDE.md"), "utf8");
    const managedBlocks = [...content.matchAll(/<!-- kernel-docs:managed:start -->/g)];
    assert.equal(managedBlocks.length, 1, "受管区块不应重复插入");
    assert.doesNotMatch(content, /当前 kernel-docs 安装源：`\/tmp\/kernel-docs-a`/);
    assert.match(content, /当前 kernel-docs 安装源：`\/tmp\/kernel-docs-b`/);
  });
});
