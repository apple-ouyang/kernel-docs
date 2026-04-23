#!/usr/bin/env tsx

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MANAGED_START = "<!-- kernel-docs:managed:start -->";
const MANAGED_END = "<!-- kernel-docs:managed:end -->";
const DOCS_SECTION = "## 文档系统";

const homeDir = process.env.HOME;
if (!homeDir) {
  throw new Error("缺少 HOME 环境变量");
}

const repoRoot = process.env.KERNEL_DOCS_REPO ?? resolve(dirname(fileURLToPath(import.meta.url)), "..");
const claudePath = resolve(homeDir, ".claude", "CLAUDE.md");

mkdirSync(dirname(claudePath), { recursive: true });

const existing = existsSync(claudePath) ? readFileSync(claudePath, "utf8") : "# 全局指令\n";
const managedBlock = buildManagedBlock(repoRoot);
const next = upsertManagedBlock(existing, managedBlock);

writeFileSync(claudePath, next, "utf8");
console.log(`已同步全局 Docs 提示到 ${claudePath}`);

function buildManagedBlock(currentRepoRoot: string): string {
  return [
    MANAGED_START,
    "### Docs（由 kernel-docs 安装脚本维护）",
    "",
    "- 长期文档仓固定入口是 `~/kernel-docs`；如果实际仓库不在这里，安装脚本会维护这个软链接。",
    "- 读代码或开发任何需求之前必须使用 `~/.claude/bin/docs-list` 命令列出当前有哪些文档可以参考。",
    "- 长期文档默认写入 `~/kernel-docs/docs/<version>/<domain>/topic.md`，不要写回当前代码仓的 `docs/`。",
    "- 继续沿文档里的链接阅读，直到当前领域上下文足够清楚；遵循 `read_when` 提示。",
    "- 笔记保持简短；行为或 API 变化必须同步更新文档；没有文档更新，不算完成交付。",
    "- 跨领域、跨模块文档要补 `read_when` 提示。",
    `- 当前 kernel-docs 安装源：\`${currentRepoRoot}\``,
    MANAGED_END,
  ].join("\n");
}

function upsertManagedBlock(content: string, managedBlock: string): string {
  const managedPattern = new RegExp(`${escapeForRegExp(MANAGED_START)}[\\s\\S]*?${escapeForRegExp(MANAGED_END)}`, "m");
  if (managedPattern.test(content)) {
    return content.replace(managedPattern, managedBlock);
  }

  const docsSectionIndex = content.indexOf(DOCS_SECTION);
  if (docsSectionIndex === -1) {
    return `${content.trimEnd()}\n\n${managedBlock}\n`;
  }

  const docsSectionEnd = findSectionEnd(content, docsSectionIndex + DOCS_SECTION.length);
  const before = content.slice(0, docsSectionEnd).trimEnd();
  const after = content.slice(docsSectionEnd).trimStart();

  return after.length > 0 ? `${before}\n\n${managedBlock}\n\n${after}` : `${before}\n\n${managedBlock}\n`;
}

function findSectionEnd(content: string, fromIndex: number): number {
  const rest = content.slice(fromIndex);
  const nextHeaderMatch = rest.match(/\n##\s+/);
  if (!nextHeaderMatch || nextHeaderMatch.index === undefined) {
    return content.length;
  }
  return fromIndex + nextHeaderMatch.index;
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
