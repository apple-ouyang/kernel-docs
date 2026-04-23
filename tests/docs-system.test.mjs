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
const DOCS_INIT_FRONTMATTER = join(REPO_ROOT, "scripts", "docs-init-frontmatter.ts");

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

test("docs-list 支持按 version 和 domain 过滤", () => {
  withTempRepo((repoRoot) => {
    writeFile(
      join(repoRoot, "docs", "v2", "memory", "page-fault.md"),
      `---
summary: V2 缺页异常入口
read_when:
  - 修改 V2 缺页异常路径前
---

# V2 缺页异常入口
`
    );

    writeFile(
      join(repoRoot, "docs", "v3", "memory", "page-fault.md"),
      `---
summary: V3 缺页异常入口
read_when:
  - 修改 V3 缺页异常路径前
---

# V3 缺页异常入口
`
    );

    writeFile(
      join(repoRoot, "docs", "v3", "arch", "scheduler.md"),
      `---
summary: V3 调度器入口
read_when:
  - 修改调度器切换路径前
---

# V3 调度器入口
`
    );

    const result = runTsx(DOCS_LIST, [repoRoot, "--version", "v3", "--domain", "memory"]);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Filters: version=v3, domain=memory/);
    assert.match(result.stdout, /V3 \/ Memory/);
    assert.match(result.stdout, /V3 缺页异常入口/);
    assert.doesNotMatch(result.stdout, /V2 缺页异常入口/);
    assert.doesNotMatch(result.stdout, /V3 调度器入口/);
  });
});

test("docs-list 支持 json 输出", () => {
  withTempRepo((repoRoot) => {
    writeFile(
      join(repoRoot, "docs", "v3", "debug", "crash.md"),
      `---
summary: V3 crash 调试入口
read_when:
  - 排查 crash 现场前
---

# V3 crash 调试入口
`
    );

    const result = runTsx(DOCS_LIST, [repoRoot, "--json", "--domain", "debug"]);

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.filters.domain, "debug");
    assert.equal(payload.docs.length, 1);
    assert.equal(payload.docs[0].relativePath, "v3/debug/crash.md");
    assert.equal(payload.docs[0].summary, "V3 crash 调试入口");
  });
});

test("docs-list 的 archive 隐藏计数跟随过滤范围", () => {
  withTempRepo((repoRoot) => {
    writeFile(
      join(repoRoot, "docs", "v3", "memory", "page-fault.md"),
      `---
summary: V3 缺页异常入口
read_when:
  - 修改 V3 缺页异常路径前
---

# V3 缺页异常入口
`
    );

    writeFile(
      join(repoRoot, "docs", "archive", "memory", "old-page-fault.md"),
      `---
summary: 历史 V3 缺页异常笔记
read_when:
  - 需要追历史缺页异常结论时
---

# 历史 V3 缺页异常笔记
`
    );

    writeFile(
      join(repoRoot, "docs", "archive", "debug", "old-crash.md"),
      `---
summary: 历史 crash 调试笔记
read_when:
  - 需要追历史 crash 处理路径时
---

# 历史 crash 调试笔记
`
    );

    const result = runTsx(DOCS_LIST, [repoRoot, "--domain", "memory"]);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /archive 文档默认隐藏，使用 --all 显示（1 篇）/);
  });
});

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

test("docs-lint 拒绝占位 summary 和空泛 read_when", () => {
  withTempRepo((repoRoot) => {
    writeFile(
      join(repoRoot, "docs", "v3", "drivers", "placeholder.md"),
      `---
summary: TODO
read_when:
  - 修改前
---

# 驱动占位文档
`
    );

    const result = runTsx(DOCS_LINT, [repoRoot]);

    assert.notEqual(result.status, 0, "lint 应该失败");
    assert.match(result.stdout + result.stderr, /summary 过于占位化/);
    assert.match(result.stdout + result.stderr, /read_when 缺少任务触发语义/);
  });
});

test("docs-lint 拒绝空 front matter 值", () => {
  withTempRepo((repoRoot) => {
    writeFile(
      join(repoRoot, "docs", "v2", "memory", "empty-front-matter.md"),
      `---
summary: ""
read_when: []
---

# 缺页异常
`
    );

    const result = runTsx(DOCS_LINT, [repoRoot]);

    assert.notEqual(result.status, 0, "lint 应该失败");
    assert.match(result.stdout + result.stderr, /missing summary/i);
    assert.match(result.stdout + result.stderr, /missing read_when/i);
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

test("docs-init-frontmatter 只为旧文档补齐空的 front matter 外壳", () => {
  withTempRepo((repoRoot) => {
    const targetPath = join(repoRoot, "docs", "v2", "debug", "crash.md");
    writeFile(
      targetPath,
      `# Crash 路径调研

这里是旧文档正文。
`
    );

    const initResult = runTsx(DOCS_INIT_FRONTMATTER, [repoRoot, "--write"]);
    assert.equal(initResult.status, 0, initResult.stderr);

    const content = readFileSync(targetPath, "utf8");
    assert.match(content, /^---\n/);
    assert.match(content, /summary: ""/);
    assert.match(content, /read_when: \[\]/);
    assert.doesNotMatch(content, /Crash 路径调研\n---/);
  });
});
