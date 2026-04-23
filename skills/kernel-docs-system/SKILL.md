---
name: kernel-docs-system
description: Use when you need to treat `docs/**/*.md` as a routed docs system for kernel and low-level repos: list doc entrypoints, choose what to read from `summary` and `read_when`, lint metadata quality, migrate legacy docs to the shared front matter, or decide the correct `version/domain` landing path before writing. Do not use for archive and knowledge-lift work, or when the main job is reading code and turning that code reading into a durable doc.
---

# Docs System

维护 `docs/` 入口系统，而不是把 markdown 当散文件处理。

## When To Use

- 先看当前仓有哪些长期文档入口
- 根据 `summary` 和 `read_when` 决定先读哪篇
- 校验 `docs/` 元数据质量
- 为旧文档补最小 front matter
- 判断文档该落到哪个 `version/domain`

## Execution Modes

- `Discover`
  - 先跑 `docs-list`
  - 需要时用 `--version`、`--domain`、`--json` 缩小范围
- `Lint`
  - 运行 `docs-lint`
  - 同时检查路径、缺字段、占位 `summary`、空泛 `read_when`
- `Migrate`
  - 运行 `docs-migrate --write`
  - 只补最小 front matter，不重写正文
- `Route`
  - 先判断版本，再判断领域，再决定是否需要抽查同主题旧文档

默认先走 `Discover`。

## Core Rules

- 文档入口发现必须先走 `docs-list`
- 不要用 `rg`、`grep`、`find` 直接扫描 `docs/` 决定先读哪篇
- `archive` 默认隐藏；只有显式 `--all` 才展示
- `archive` 是生命周期，不是版本维度
- `docs-migrate` 只补外壳，不做完整语义迁移
- `summary` 必须回答“这篇文档帮助做什么判断/操作”
- `read_when` 必须写成任务触发语句

## Stop Conditions

下面这些情况不要继续留在这里：

- 用户真正要的是归档、知识上浮、修复错误归档
- 任务核心已经变成代码调研沉淀，而不是 docs 入口维护
- 落点还没判断清楚，就准备直接新建文件

这时改走归档流程或 `kernel-code-to-docs`。

## Commands

- `~/.claude/bin/docs-list [repo-root] [--all] [--version <v2|v3|lite>] [--domain <domain>] [--json]`
- `~/.claude/bin/docs-lint [repo-root] [--files <path...>]`
- `~/.claude/bin/docs-migrate [repo-root] [--files <path...>] --write`

## References

按需读取，不要整包展开：

- `references/version-routing.md`
- `references/front-matter.md`
- `references/domain-map.md`

## Output Contract

默认输出必须至少回答下面一项：

- 这次应该先读哪些文档，以及为什么
- 哪些文件元数据不合规
- 哪些旧文档已补最小模板
- 某篇文档更适合哪个 `version/domain`

## Done Criteria

- 入口发现：只看输出就能决定下一篇该读什么
- 元数据校验：问题文件、问题类型、下一步动作都明确
- 迁移：正文原样保留，只补最小外壳
- 路由：版本和领域判断都有依据
