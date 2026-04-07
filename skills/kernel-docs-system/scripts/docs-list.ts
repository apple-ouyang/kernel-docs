#!/usr/bin/env tsx

import { DOC_DOMAIN_LABELS, DOC_DOMAINS, DOC_VERSION_LABELS, DOC_VERSIONS, isArchived, loadDocuments } from "./lib.ts";

const args = process.argv.slice(2);
const showAll = args.includes("--all");
const repoArg = args.find((arg) => arg !== "--all");

const { docsRoot, docs } = loadDocuments(repoArg);
const visibleDocs = showAll ? docs : docs.filter((doc) => !isArchived(doc));
const hiddenArchiveCount = docs.length - visibleDocs.length;
const groups = new Map<string, typeof visibleDocs>();

for (const version of DOC_VERSIONS) {
  for (const domain of DOC_DOMAINS) {
    groups.set(`${DOC_VERSION_LABELS[version]} / ${DOC_DOMAIN_LABELS[domain]}`, []);
  }
}
groups.set("Unknown", []);
groups.set("Archive", []);

for (const doc of visibleDocs) {
  if (doc.archived) {
    if (doc.group === "unknown") {
      groups.get("Archive")!.push(doc);
      continue;
    }
    groups.get("Archive")!.push(doc);
    continue;
  }

  if (doc.group === "unknown") {
    groups.get("Unknown")!.push(doc);
    continue;
  }
  if (!doc.version) {
    groups.get("Unknown")!.push(doc);
    continue;
  }
  groups.get(`${DOC_VERSION_LABELS[doc.version]} / ${DOC_DOMAIN_LABELS[doc.group]}`)!.push(doc);
}

console.log(`Docs root: ${docsRoot}`);
console.log("");

for (const [label, records] of groups) {
  if (records.length === 0) {
    continue;
  }

  console.log(label);
  for (const record of records) {
    const summary = record.metadata.summary ?? record.metadata.title ?? "缺少 summary";
    console.log(`- ${record.relativePath}`);
    console.log(`  Summary: ${summary}`);
    if (record.metadata.readWhen.length > 0) {
      console.log("  Read when:");
      for (const item of record.metadata.readWhen) {
        console.log(`    - ${item}`);
      }
    } else {
      console.log("  Read when: 缺少 read_when");
    }
  }
  console.log("");
}

if (!showAll && hiddenArchiveCount > 0) {
  console.log(`archive 文档默认隐藏，使用 --all 显示（${hiddenArchiveCount} 篇）`);
}
