---
name: kernel-code-research
description: Use when reading kernel, OS, or low-level system code before documenting it. Trigger whenever the user asks to understand how memory, filesystem, drivers, security, debug, DFX, boot, scheduler, IPC, or other core subsystems work, especially if the goal is to turn code reading into a durable design document under `docs/`.
---

# Kernel Code Research

## Overview

这个 Skill 用来把“读代码”沉淀成可复用文档，而不是临时聊天结论。输出目标不是 plan，也不是 TODO 清单，而是一篇放进对应领域目录、以后还能继续读的代码调研文档。

## Before You Start

先做两件事：

1. 先使用 `kernel-docs-system` 列出当前仓的文档入口
2. 判断这次调研应该落到哪个领域目录

固定领域：

- `arch`
- `memory`
- `filesystem`
- `dfx`
- `debug`
- `security`
- `drivers`

`process` 不单独建类。进程、线程、调度、启动、IPC 默认归 `arch`。

## Output Path

把调研结果直接写到对应领域目录，推荐命名：

- `docs/<domain>/code-reading-<topic>.md`

示例：

- `docs/memory/code-reading-page-fault.md`
- `docs/filesystem/code-reading-vfs-open.md`
- `docs/arch/code-reading-scheduler.md`

## Front Matter

最小 front matter：

```yaml
---
summary: 一句话概括这篇调研解决了什么理解问题
read_when:
  - AI 需要判断这篇文档是否覆盖当前代码调研目标时
  - 准备修改相关模块前
---
```

`read_when` 要写“AI 什么时候该读它”，不是写状态，也不是写“待完善”。

## What To Extract

优先提炼这些内容：

- 模块边界
- 关键数据结构
- 核心调用链
- 锁、线程、内存语义
- 接口约束和输入输出假设
- 容易改坏的风险点
- 证据索引

## Suggested Structure

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

## Important Rules

- 不要把输出写成计划文档
- 不要单独创建 `research/` 目录
- 结论先讲清楚，再补证据路径
- 如果已有同主题文档，优先更新原文，而不是新建重复文档
- 如果结论仍不完整，把不确定点写进“风险点”或“未决问题”，不要转成 TODO 清单
