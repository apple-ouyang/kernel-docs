#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const MANAGED_START = "<!-- kernel-docs:managed:start -->";
const MANAGED_END = "<!-- kernel-docs:managed:end -->";

const homeDir = process.env.HOME;
if (!homeDir) {
  throw new Error("缺少 HOME 环境变量");
}

const claudePath = resolve(homeDir, ".claude", "CLAUDE.md");
if (!existsSync(claudePath)) {
  console.log(`未发现 ${claudePath}，跳过受管 Docs 区块清理。`);
  process.exit(0);
}

const existing = readFileSync(claudePath, "utf8");
const managedPattern = new RegExp(`\\n*${escapeForRegExp(MANAGED_START)}[\\s\\S]*?${escapeForRegExp(MANAGED_END)}\\n*`, "m");

if (!managedPattern.test(existing)) {
  console.log("未发现 kernel-docs 受管 Docs 区块，跳过。");
  process.exit(0);
}

const next = normalizeSpacing(existing.replace(managedPattern, "\n\n"));
writeFileSync(claudePath, next, "utf8");
console.log(`已从 ${claudePath} 移除受管 Docs 区块。`);

function normalizeSpacing(content) {
  const collapsed = content.replace(/\n{3,}/g, "\n\n").trimEnd();
  return collapsed.length > 0 ? `${collapsed}\n` : "";
}

function escapeForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
