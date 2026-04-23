---
name: kernel-code-to-docs
description: Use when reading kernel, OS, or low-level system code and turning that code reading into a durable doc under `docs/`: choose the correct `version/domain`, decide whether to update or create a doc, extract the stable conclusions, and write the result as a reusable design note rather than a plan or TODO list. Do not use for docs-only entrypoint maintenance, metadata lint or migrate tasks, or archive and knowledge-lift work.
---

# Kernel Code To Docs

把“读代码”沉淀成长期文档，不输出临时聊天结论、计划文档或 TODO 清单。
长期文档仓固定入口是 `~/kernel-docs`；如果实际仓库不在这个目录，安装脚本会维护同名软链接。
长期文档默认只写入 `~/kernel-docs/docs/<version>/<domain>/topic.md`，不要把长期文档写回当前代码仓的 `docs/`。

## When To Use

- 用户要你先读内核/系统代码，再整理成长期文档
- 目标是沉淀模块边界、调用链、约束和风险点
- 输出要进入 `~/kernel-docs/docs/<version>/<domain>/`

## Execution Skeleton

按下面顺序执行：

1. 先调用 `kernel-docs-system` 看现有文档入口
2. 判断这次调研的 `version/domain`
3. 抽查同主题文档，决定是更新原文还是新建
4. 读代码并提炼稳定结论
5. 先写结论，再补证据索引和风险点

## Core Rules

- 不要把输出写成计划文档
- 不要单独创建 `research/` 目录
- 结论先讲清楚，再补证据路径
- 如果已有同主题文档，优先更新原文，而不是新建重复文档
- 不确定点写进风险点，不要转成 TODO 清单
- 文档路径固定为 `~/kernel-docs/docs/<version>/<domain>/topic.md`
- `process` 不单独建类，进程、线程、调度、启动、IPC 默认归 `arch`

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
- 当前路径无法判断版本：根据用户语义决定是否读 `docs/v2/`、`docs/v3/` 或 `docs/lite/`

## Front Matter And Structure

最小 front matter：

```yaml
---
summary: 一句话概括这篇调研解决了什么理解问题
read_when:
  - AI 需要判断这篇文档是否覆盖当前代码调研目标时
  - 准备修改相关模块前
---
```

推荐正文结构：

```md
# 标题

## TL;DR

## 模块边界

## 关键数据结构

## 调用链

## 并发与内存语义

## 接口与约束

## 风险点

## 证据索引
```

`source` 如果需要写：

- 参考文档：只写文档名
- 参考代码：写 `git仓库名:仓内相对路径`
- 不要求穷举所有参考文件，只记录主要来源

## What To Extract

读代码后优先提炼这些内容：

- 模块边界
- 关键数据结构
- 核心调用链
- 锁、线程、内存语义
- 接口约束和输入输出假设
- 容易改坏的风险点
- 证据索引

## Stop Conditions

下面这些情况不要硬写：

- `version/domain` 还没判断清楚
- 还没判断该更新旧文还是新建
- 证据不足以支撑结论
- 用户真正要的是归档、迁移步骤或计划

## Output Contract

默认输出的文档或结论必须明确包含：

- 目标路径
- 为什么是这个版本目录
- 为什么是这个领域目录
- 主要参考了哪些代码路径
- 已经确定的结论
- 还不能拍板的风险点

## Done Criteria

- 已明确是更新原文还是新建
- 文档先讲结论，再给证据
- 当前实现和历史参考没有混写
- 风险点写清楚了边界
