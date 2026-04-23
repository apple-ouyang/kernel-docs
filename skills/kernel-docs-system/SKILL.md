---
name: kernel-docs-system
description: Use when you need to treat `docs/**/*.md` as a routed docs system for kernel and low-level repos: list doc entrypoints, choose what to read from `summary` and `read_when`, lint metadata quality, migrate legacy docs to the shared front matter, or decide the correct `version/domain` landing path before writing. Do not use for archive and knowledge-lift work, or when the main job is reading code and turning that code reading into a durable doc.
---

# Docs System

维护 `docs/` 入口系统，而不是把 markdown 当散文件处理。
长期文档仓固定入口是 `~/kernel-docs`；如果实际仓库不在这个目录，安装脚本会维护同名软链接。
长期文档默认只写入 `~/kernel-docs/docs/<version>/<domain>/topic.md`，不要把长期文档写回当前代码仓的 `docs/`。

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
- `archive` 是生命周期，不是版本维度；归档路径固定为 `docs/archive/<domain>/`
- 文档路径固定为 `~/kernel-docs/docs/<version>/<domain>/topic.md`
- 不使用 `plan` / `research` 深目录
- `process` 已并入 `arch`
- `docs-migrate` 只补外壳，不做完整语义迁移
- `summary` 必须回答“这篇文档帮助做什么判断/操作”
- `summary` 不能写成 `TODO`、`待补充`、`占位`
- `read_when` 必须写成任务触发语句
- `read_when` 不能只写“修改前”“需要时”“排查时”

## Version And Domain Rules

固定版本目录：

- `v2`
- `v3`
- `lite`

固定领域目录：

- `arch`
- `memory`
- `filesystem`
- `dfx`
- `debug`
- `security`
- `drivers`

归类规则：

- 架构、启动、调度、IPC、跨子系统机制：`arch`
- 内存管理、页表、分配器、缺页异常：`memory`
- VFS、具体文件系统实现、缓存一致性：`filesystem`
- 日志、trace、观测、诊断链路：`dfx`
- GDB、crash 分析、现场定位、调试手册：`debug`
- 权限、隔离、认证、加固：`security`
- 设备模型、总线、驱动框架、外设适配：`drivers`

版本判断：

- 仓名以 `hm-` 开头：`v3`
- 绝对路径包含 `RTOS_V3_master`：`v3`
- 绝对路径包含 `RTOS_V2_master`：`v2`
- 路径或仓名包含 `kernel-5.x`：`v2`
- `lite` 只有用户明确说明时才按 `lite` 处理

阅读已有文档时遵循非对称规则：

- 当前路径命中 `v2`：只看 `docs/v2/`
- 当前路径命中 `v3`：默认看 `docs/v3/`；只有用户明确要求参考 `v2` / `Linux` 时，才额外看 `docs/v2/`
- 当前上下文是 `lite`：先看 `docs/lite/`；不够时再补看 `docs/v2/`；不看 `docs/v3/`
- 当前路径无法判断版本：根据用户提到的 `V2` / `Linux` / `V3` / `鸿蒙` / `lite` 选择版本文档
- 需要追历史实现或废弃方案时，再额外看 `docs/archive/`

## Front Matter

推荐最小模板：

```yaml
---
summary: 一句话说明这篇文档帮助完成什么判断或操作
read_when:
  - 遇到什么任务、决策或排障场景时先读
---
```

约束：

- `summary` 优先写“作用 + 决策对象”，不要只重复标题
- `read_when` 表示“AI 在什么场景下应该优先读这篇文档”
- `read_when` 要写成任务触发语句，不要写成状态词、作者备注或空泛占位

`source` 如果需要写，语义是“这篇文档主要基于什么材料写成”，不是必填路径：

- 参考文档时，只记录文档名
- 参考代码时，写 `git仓库名:仓内相对路径`
- 不要求穷举所有参考文件；精确证据路径和行号放正文

## Stop Conditions

下面这些情况不要继续留在这里：

- 用户真正要的是归档、知识上浮、修复错误归档
- 任务核心已经变成代码调研沉淀，而不是 docs 入口维护
- 落点还没判断清楚，就准备直接新建文件

这时改走 archive / knowledge-lift 流程或 `kernel-code-to-docs`。

## Commands

- `~/.claude/bin/docs-list ~/kernel-docs [--all] [--version <v2|v3|lite>] [--domain <domain>] [--json]`
- `~/.claude/bin/docs-lint ~/kernel-docs [--files <path...>]`
- `~/.claude/bin/docs-migrate ~/kernel-docs [--files <path...>] --write`

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
