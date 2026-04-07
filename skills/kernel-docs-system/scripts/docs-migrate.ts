#!/usr/bin/env tsx

import { readFileSync } from "node:fs";
import { buildFrontMatter, loadDocuments, writeContent } from "./lib.ts";

const args = process.argv.slice(2);
const write = args.includes("--write");
const filesFlagIndex = args.indexOf("--files");
const repoArg =
  filesFlagIndex === -1
    ? args.find((arg) => arg !== "--write")
    : args.find((arg, index) => arg !== "--write" && index < filesFlagIndex);
const selectedFiles = filesFlagIndex === -1 ? [] : args.slice(filesFlagIndex + 1).filter((arg) => arg !== "--write");

const { docs } = loadDocuments(repoArg, selectedFiles);
const targets = docs.filter((doc) => !doc.metadata.hasFrontMatter);

if (targets.length === 0) {
  console.log("没有需要迁移的旧文档。");
  process.exit(0);
}

if (!write) {
  console.log("以下文档缺少 front matter：");
  for (const doc of targets) {
    console.log(`- ${doc.relativePath}`);
  }
  console.log("");
  console.log("加上 --write 后会为这些文档补齐最小 front matter 外壳。");
  console.log("注意：summary / read_when 仍应由 AI 继续复核和完善。");
  process.exit(0);
}

for (const doc of targets) {
  const current = readFileSync(doc.fullPath, "utf8");
  const migrated = buildFrontMatter(doc.relativePath, current);
  writeContent(doc.fullPath, migrated);
  console.log(`migrated: ${doc.relativePath}`);
}
