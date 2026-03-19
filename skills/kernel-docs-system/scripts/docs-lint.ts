#!/usr/bin/env tsx

import { loadDocuments, validateDocLocation } from "./lib.ts";

const args = process.argv.slice(2);
const filesFlagIndex = args.indexOf("--files");
const repoArg = filesFlagIndex === -1 ? args[0] : args[0] === "--files" ? undefined : args[0];
const selectedFiles = filesFlagIndex === -1 ? [] : args.slice(filesFlagIndex + 1);
const { docs } = loadDocuments(repoArg, selectedFiles);

const issues: string[] = [];

for (const doc of docs) {
  const locationIssue = validateDocLocation(doc.relativePath);
  if (locationIssue) {
    issues.push(`${doc.relativePath}: ${locationIssue}`);
  }

  if (!doc.metadata.hasFrontMatter) {
    issues.push(`${doc.relativePath}: missing front matter`);
    continue;
  }

  if (!doc.metadata.summary) {
    issues.push(`${doc.relativePath}: missing summary`);
  }
  if (doc.metadata.readWhen.length === 0) {
    issues.push(`${doc.relativePath}: missing read_when`);
  }
}

if (docs.length === 0) {
  console.log("没有需要校验的文档。");
  process.exit(0);
}

if (issues.length > 0) {
  console.error("发现文档元数据问题：");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`文档元数据校验通过，共 ${docs.length} 篇。`);
