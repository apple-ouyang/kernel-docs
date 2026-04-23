#!/usr/bin/env tsx

import {
  DOC_DOMAIN_LABELS,
  DOC_DOMAINS,
  DOC_VERSION_LABELS,
  DOC_VERSIONS,
  filterDocuments,
  loadDocuments,
} from "./lib.ts";

const args = process.argv.slice(2);
const showAll = args.includes("--all");
const asJson = args.includes("--json");
const version = readEnumFlag("--version", DOC_VERSIONS);
const domain = readEnumFlag("--domain", DOC_DOMAINS);
const repoArg = args.find((arg, index) => {
  if (arg === "--all" || arg === "--json") {
    return false;
  }
  if (args[index - 1] === "--version" || args[index - 1] === "--domain") {
    return false;
  }
  return true;
});

const { docsRoot, docs } = loadDocuments(repoArg);
const matchingDocs = filterDocuments(docs, {
  version,
  domain,
  includeArchive: true,
});
const visibleDocs = filterDocuments(docs, {
  version,
  domain,
  includeArchive: showAll,
});
const hiddenArchiveCount =
  matchingDocs.filter((doc) => doc.archived).length - visibleDocs.filter((doc) => doc.archived).length;
const groups = new Map<string, typeof visibleDocs>();

for (const docVersion of DOC_VERSIONS) {
  for (const docDomain of DOC_DOMAINS) {
    groups.set(`${DOC_VERSION_LABELS[docVersion]} / ${DOC_DOMAIN_LABELS[docDomain]}`, []);
  }
}
groups.set("Unknown", []);
groups.set("Archive", []);

for (const doc of visibleDocs) {
  if (doc.archived) {
    groups.get("Archive")!.push(doc);
    continue;
  }

  if (doc.group === "unknown" || !doc.version) {
    groups.get("Unknown")!.push(doc);
    continue;
  }

  groups.get(`${DOC_VERSION_LABELS[doc.version]} / ${DOC_DOMAIN_LABELS[doc.group]}`)!.push(doc);
}

if (asJson) {
  console.log(
    JSON.stringify(
      {
        docsRoot,
        filters: {
          version: version ?? null,
          domain: domain ?? null,
          includeArchive: showAll,
        },
        docs: visibleDocs.map((doc) => ({
          path: doc.fullPath,
          relativePath: doc.relativePath,
          version: doc.version,
          domain: doc.archived ? doc.archivedDomain : doc.group === "unknown" ? null : doc.group,
          archived: doc.archived,
          summary: doc.metadata.summary ?? doc.metadata.title ?? null,
          readWhen: doc.metadata.readWhen,
        })),
        hiddenArchiveCount: showAll ? 0 : Math.max(hiddenArchiveCount, 0),
      },
      null,
      2
    )
  );
  process.exit(0);
}

console.log(`Docs root: ${docsRoot}`);
console.log("");

if (version || domain) {
  const filters = [];
  if (version) {
    filters.push(`version=${version}`);
  }
  if (domain) {
    filters.push(`domain=${domain}`);
  }
  console.log(`Filters: ${filters.join(", ")}`);
  console.log("");
}

for (const [label, records] of groups) {
  if (records.length === 0) {
    continue;
  }

  console.log(label);
  for (const record of records) {
    const summary = record.metadata.summary ?? record.metadata.title ?? "缺少 summary";
    console.log(`- ${record.fullPath}`);
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

if (visibleDocs.length === 0) {
  console.log("没有命中文档。");
}

if (!showAll && hiddenArchiveCount > 0) {
  console.log(`archive 文档默认隐藏，使用 --all 显示（${hiddenArchiveCount} 篇）`);
}

function readEnumFlag<const T extends readonly string[]>(flag: string, allowedValues: T): T[number] | undefined {
  const flagIndex = args.indexOf(flag);
  if (flagIndex === -1) {
    return undefined;
  }

  const value = args[flagIndex + 1];
  if (!value) {
    throw new Error(`${flag} 缺少参数，可选值：${allowedValues.join(", ")}`);
  }
  if (!allowedValues.includes(value)) {
    throw new Error(`${flag} 只接受 ${allowedValues.join(", ")}`);
  }
  return value as T[number];
}
