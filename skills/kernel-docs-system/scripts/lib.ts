import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative, resolve, sep } from "node:path";

export const DOC_DOMAINS = [
  "arch",
  "memory",
  "filesystem",
  "dfx",
  "debug",
  "security",
  "drivers",
] as const;

export const DOC_VERSIONS = ["v2", "v3", "lite"] as const;

export type DocDomain = (typeof DOC_DOMAINS)[number];
export type DocVersion = (typeof DOC_VERSIONS)[number];
export type DocGroup = DocDomain | "unknown";

export const DOC_DOMAIN_LABELS: Record<DocDomain, string> = {
  arch: "Arch",
  memory: "Memory",
  filesystem: "Filesystem",
  dfx: "DFX",
  debug: "Debug",
  security: "Security",
  drivers: "Drivers",
};

export const DOC_VERSION_LABELS: Record<DocVersion, string> = {
  v2: "V2",
  v3: "V3",
  lite: "Lite",
};

const DEFAULT_READ_WHEN: Record<DocDomain, string> = {
  arch: "任务涉及架构、启动、调度、IPC 或跨子系统机制时",
  memory: "任务涉及页表、分配器、缺页异常或内存管理时",
  filesystem: "任务涉及 VFS、文件系统实现、缓存一致性或 IO 路径时",
  dfx: "任务涉及日志、trace、观测、诊断或性能分析时",
  debug: "任务涉及崩溃定位、GDB、现场还原或调试方法时",
  security: "任务涉及权限、隔离、认证、访问控制或安全加固时",
  drivers: "任务涉及设备模型、驱动框架、总线或外设适配时",
};

export interface DocMetadata {
  hasFrontMatter: boolean;
  summary: string | null;
  readWhen: string[];
  title: string | null;
  body: string;
}

export interface DocRecord {
  fullPath: string;
  relativePath: string;
  metadata: DocMetadata;
  group: DocGroup;
  version: DocVersion | null;
  archived: boolean;
  archivedDomain: DocDomain | null;
}

const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown"]);

export function resolveDocsRoot(inputPath?: string): string {
  const basePath = resolve(inputPath ?? process.cwd());
  const docsPath = basename(basePath) === "docs" ? basePath : join(basePath, "docs");
  const stats = statSync(docsPath, { throwIfNoEntry: false });
  if (!stats || !stats.isDirectory()) {
    throw new Error(`找不到 docs 目录：${docsPath}`);
  }
  return docsPath;
}

export function walkMarkdownFiles(rootDir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) {
        continue;
      }

      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry.isFile() && MARKDOWN_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }
    }
  }

  walk(rootDir);
  return files.sort((a, b) => a.localeCompare(b));
}

export function loadDocuments(inputPath?: string, selectedFiles: string[] = []): { docsRoot: string; docs: DocRecord[] } {
  const docsRoot = resolveDocsRoot(inputPath);
  const fullPaths = selectedFiles.length > 0 ? resolveSelectedFiles(docsRoot, selectedFiles) : walkMarkdownFiles(docsRoot);
  const docs = fullPaths.map((fullPath) => {
    const relativePath = relative(docsRoot, fullPath);
    const { group, version, archived, archivedDomain } = classifyPath(relativePath);
    return {
      fullPath,
      relativePath,
      metadata: parseMarkdown(readFileSync(fullPath, "utf8")),
      group,
      version,
      archived,
      archivedDomain,
    };
  });

  return { docsRoot, docs };
}

export function parseMarkdown(content: string): DocMetadata {
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n*/);
  const frontMatter = frontMatterMatch?.[1] ?? "";
  const body = frontMatterMatch ? content.slice(frontMatterMatch[0].length) : content;

  return {
    hasFrontMatter: Boolean(frontMatterMatch),
    summary: readScalar(frontMatter, "summary"),
    readWhen: readListOrScalar(frontMatter, "read_when"),
    title: readTitle(body),
    body,
  };
}

export function isArchived(record: DocRecord): boolean {
  return record.archived;
}

export function validateDocLocation(relativePath: string): string | null {
  const normalized = normalizePath(relativePath);
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length < 3) {
    return `目录不合法：${relativePath}。文档必须放在已定义的版本与领域目录下，例如 docs/v2/memory/*.md`;
  }

  const [first, second, third] = segments;
  if (!isDocVersion(first)) {
    return `目录不合法：${relativePath}。允许的顶层目录是 ${DOC_VERSIONS.join(", ")}，归档使用 <version>/archive/<domain>/`;
  }

  if (isDocDomain(second)) {
    return null;
  }
  if (second === "archive" && third && isDocDomain(third)) {
    return null;
  }

  return `目录不合法：${relativePath}。允许的顶层目录是 ${DOC_VERSIONS.join(", ")}，归档使用 <version>/archive/<domain>/`;
}

export function buildFrontMatter(relativePath: string, content: string): string {
  const parsed = parseMarkdown(content);
  if (parsed.hasFrontMatter) {
    return content;
  }

  const title = parsed.title ?? basename(relativePath, extname(relativePath));
  const { group, archivedDomain } = classifyPath(relativePath);
  const domain = group === "unknown" ? archivedDomain : group;
  const readWhen = domain && domain !== "unknown" ? DEFAULT_READ_WHEN[domain] : "AI 需要判断这篇文档是否与当前任务相关时";

  const frontMatter = [
    "---",
    `summary: ${sanitizeScalar(title)}`,
    "read_when:",
    `  - ${sanitizeScalar(readWhen)}`,
    "---",
    "",
  ].join("\n");

  return `${frontMatter}${content}`;
}

export function writeContent(filePath: string, content: string) {
  writeFileSync(filePath, content, "utf8");
}

function resolveSelectedFiles(docsRoot: string, selectedFiles: string[]): string[] {
  const repoRoot = resolve(docsRoot, "..");
  const results = new Set<string>();

  for (const rawPath of selectedFiles) {
    const candidate = resolve(repoRoot, rawPath);
    const stats = statSync(candidate, { throwIfNoEntry: false });
    if (!stats || !stats.isFile()) {
      continue;
    }
    if (!MARKDOWN_EXTENSIONS.has(extname(candidate).toLowerCase())) {
      continue;
    }
    const relativeToDocs = relative(docsRoot, candidate);
    if (relativeToDocs.startsWith(`..${sep}`) || relativeToDocs === "..") {
      continue;
    }
    results.add(candidate);
  }

  return [...results].sort((a, b) => a.localeCompare(b));
}

function classifyPath(relativePath: string): {
  group: DocGroup;
  version: DocVersion | null;
  archived: boolean;
  archivedDomain: DocDomain | null;
} {
  const normalized = normalizePath(relativePath);
  const segments = normalized.split("/").filter(Boolean);
  const [first, second, third] = segments;

  if (!first || !isDocVersion(first)) {
    return {
      group: "unknown",
      version: null,
      archived: false,
      archivedDomain: null,
    };
  }

  if (second === "archive") {
    return {
      group: third && isDocDomain(third) ? third : "unknown",
      version: first,
      archived: true,
      archivedDomain: third && isDocDomain(third) ? third : null,
    };
  }

  if (second && isDocDomain(second)) {
    return {
      group: second,
      version: first,
      archived: false,
      archivedDomain: null,
    };
  }

  return {
    group: "unknown",
    version: first,
    archived: false,
    archivedDomain: null,
  };
}

function readScalar(frontMatter: string, key: string): string | null {
  const regex = new RegExp(`^${key}:\\s*(.+)$`, "m");
  const match = frontMatter.match(regex);
  if (!match) {
    return null;
  }
  return stripQuotes(match[1].trim());
}

function readListOrScalar(frontMatter: string, key: string): string[] {
  const lines = frontMatter.split("\n");
  const items: string[] = [];
  let collecting = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.startsWith(`${key}:`)) {
      collecting = true;
      const inline = line.slice(`${key}:`.length).trim();
      if (inline.startsWith("[") && inline.endsWith("]")) {
        return inline
          .slice(1, -1)
          .split(",")
          .map((item) => stripQuotes(item.trim()))
          .filter(Boolean);
      }
      if (inline) {
        return [stripQuotes(inline)];
      }
      continue;
    }

    if (!collecting) {
      continue;
    }

    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      items.push(stripQuotes(trimmed.slice(2).trim()));
      continue;
    }

    if (trimmed === "") {
      continue;
    }

    break;
  }

  return items.filter(Boolean);
}

function readTitle(body: string): string | null {
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function normalizePath(filePath: string): string {
  return filePath.replaceAll("\\", "/");
}

function isDocDomain(value: string): value is DocDomain {
  return DOC_DOMAINS.includes(value as DocDomain);
}

function isDocVersion(value: string): value is DocVersion {
  return DOC_VERSIONS.includes(value as DocVersion);
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, "");
}

function sanitizeScalar(value: string): string {
  return value.replace(/\r?\n/g, " ").trim();
}
