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
const targets = docs.filter(
  (doc) => !doc.metadata.hasFrontMatter || !doc.metadata.hasSummaryField || !doc.metadata.hasReadWhenField
);

if (targets.length === 0) {
  console.log("没有需要补空 YAML 头或缺失字段的文档。");
  process.exit(0);
}

if (!write) {
  console.log("以下文档缺少 YAML 头或必填字段：");
  for (const doc of targets) {
    console.log(`- ${doc.relativePath}`);
  }
  console.log("");
  console.log("加上 --write 后会为这些文档补齐空的 YAML front matter 外壳或缺失字段。");
  console.log("脚本不会自动生成 summary / read_when 内容。");
  process.exit(0);
}

for (const doc of targets) {
  const current = readFileSync(doc.fullPath, "utf8");
  const initialized = buildFrontMatter(doc.relativePath, current);
  writeContent(doc.fullPath, initialized);
  console.log(`initialized: ${doc.relativePath}`);
}
