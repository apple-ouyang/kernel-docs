import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(THIS_DIR, "..");
const DOCS_LIST = join(REPO_ROOT, "scripts", "docs-list.ts");
const DOCS_LINT = join(REPO_ROOT, "scripts", "docs-lint.ts");
const DOCS_MIGRATE = join(REPO_ROOT, "scripts", "docs-migrate.ts");

function withTempRepo(setup) {
  const repoRoot = mkdtempSync(join(tmpdir(), "docs-system-"));
  try {
    setup(repoRoot);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
}

function writeFile(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
}

function runTsx(scriptPath, args = []) {
  return spawnSync("tsx", [scriptPath, ...args], {
    encoding: "utf8",
  });
}

test("docs-list 按领域分组并默认隐藏 archive", () => {
  withTempRepo((repoRoot) => {
    writeFile(
      join(repoRoot, "docs", "v3", "memory", "overview-memory.md"),
      `---
summary: 内存子系统总览
read_when:
  - 任务涉及页表或内存分配前
---

# 内存子系统总览
`
    );

    writeFile(
      join(repoRoot, "docs", "archive", "memory", "old-memory-notes.md"),
      `---
summary: 旧版内存笔记
read_when:
  - 只在需要追历史结论时
---

# 旧版内存笔记
`
    );

    const result = runTsx(DOCS_LIST, [repoRoot]);
    const visiblePath = join(repoRoot, "docs", "v3", "memory", "overview-memory.md");
    const hiddenPath = join(repoRoot, "docs", "archive", "memory", "old-memory-notes.md");

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /V3 \/ Memory/);
    assert.match(result.stdout, new RegExp(escapeRegExp(visiblePath)));
    assert.doesNotMatch(result.stdout, new RegExp(escapeRegExp(hiddenPath)));
    assert.match(result.stdout, /archive 文档默认隐藏/);
  });
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("docs-lint 支持按文件校验并要求 read_when", () => {
  withTempRepo((repoRoot) => {
    writeFile(
      join(repoRoot, "docs", "v2", "arch", "good.md"),
      `---
summary: 架构总览
read_when:
  - 需要理解跨子系统机制时
---

# 架构总览
`
    );

    writeFile(
      join(repoRoot, "docs", "v2", "security", "bad.md"),
      `---
summary: 安全约束
---

# 安全约束
`
    );

    const result = runTsx(DOCS_LINT, [repoRoot, "--files", "docs/v2/security/bad.md"]);

    assert.notEqual(result.status, 0, "lint 应该失败");
    assert.match(result.stdout + result.stderr, /v2\/security\/bad\.md/);
    assert.match(result.stdout + result.stderr, /missing read_when/i);
    assert.doesNotMatch(result.stdout + result.stderr, /v2\/arch\/good\.md/);
  });
});

test("docs-lint 拒绝未定义的顶层分类", () => {
  withTempRepo((repoRoot) => {
    writeFile(
      join(repoRoot, "docs", "misc", "note.md"),
      `---
summary: 杂项
read_when:
  - 需要看杂项时
---

# 杂项
`
    );

    const result = runTsx(DOCS_LINT, [repoRoot]);

    assert.notEqual(result.status, 0, "lint 应该失败");
    assert.match(result.stdout + result.stderr, /目录不合法/);
  });
});

test("docs-lint 拒绝旧的 docs domain 直放结构", () => {
  withTempRepo((repoRoot) => {
    writeFile(
      join(repoRoot, "docs", "memory", "legacy.md"),
      `---
summary: 旧结构
read_when:
  - 只用于验证旧结构报错
---

# 旧结构
`
    );

    const result = runTsx(DOCS_LINT, [repoRoot]);

    assert.notEqual(result.status, 0, "lint 应该失败");
    assert.match(result.stdout + result.stderr, /目录不合法/);
    assert.match(result.stdout + result.stderr, /archive\/<domain>/);
  });
});

test("docs-lint 接受统一 archive 路径", () => {
  withTempRepo((repoRoot) => {
    writeFile(
      join(repoRoot, "docs", "archive", "debug", "legacy-crash.md"),
      `---
summary: 历史 crash 处理笔记
read_when:
  - 需要追溯旧版 crash 处理路径时
---

# 历史 crash 处理笔记
`
    );

    const result = runTsx(DOCS_LINT, [repoRoot]);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout + result.stderr, /校验通过/);
  });
});

test("docs-migrate 为旧文档补齐 summary 和 read_when", () => {
  withTempRepo((repoRoot) => {
    const targetPath = join(repoRoot, "docs", "v2", "debug", "crash.md");
    writeFile(
      targetPath,
      `# Crash 路径调研

这里是旧文档正文。
`
    );

    const migrateResult = runTsx(DOCS_MIGRATE, [repoRoot, "--write"]);
    assert.equal(migrateResult.status, 0, migrateResult.stderr);

    const content = readFileSync(targetPath, "utf8");
    assert.match(content, /^---\n/);
    assert.match(content, /summary: Crash 路径调研/);
    assert.match(content, /read_when:\n  - 任务涉及崩溃定位、GDB、现场还原或调试方法时/);
  });
});
