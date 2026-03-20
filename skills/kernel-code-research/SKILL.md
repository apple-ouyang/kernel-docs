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

- `docs/v2/<domain>/<topic>.md`
- `docs/v3/<domain>/<topic>.md`
- `docs/lite/<domain>/<topic>.md`

示例：

- `docs/v2/memory/page-fault.md`
- `docs/v3/filesystem/vfs-open.md`
- `docs/lite/arch/scheduler.md`

先根据当前打开路径、当前工作区路径或用户提供的代码路径判定默认版本：

- 仓名以 `hm-` 开头：`v3`
- 绝对路径包含 `RTOS_V3_master`：`v3`
- 绝对路径包含 `RTOS_V2_master`：`v2`
- 路径或仓名包含 `kernel-5.x`：`v2`
- `lite` 路径规则暂未固定；当前只有用户明确说明是 `lite` 时，才按 `lite` 处理

阅读已有文档时遵循非对称规则：

- 当前路径命中 `v2`：只看 `docs/v2/`
- 当前路径命中 `v3`：默认看 `docs/v3/`；只有用户明确要求参考 `v2` / `Linux` 时，才额外看 `docs/v2/`
- 当前上下文是 `lite`：先看 `docs/lite/`；不够时再补看 `docs/v2/`；不看 `docs/v3/`
- 当前路径无法判断版本：再根据用户语义决定是否读 `docs/v2/`、`docs/v3/` 或 `docs/lite/`

新写文档时：

- 当前路径命中 `v2`：默认写 `docs/v2/<domain>/<topic>.md`
- 当前路径命中 `v3`：默认写 `docs/v3/<domain>/<topic>.md`
- 当前上下文是 `lite`：默认写 `docs/lite/<domain>/<topic>.md`

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

`source` 如果需要写：

- 参考文档：只写文档名，不要求写仓库或路径
- 参考代码：写 `git仓库名:仓内相对路径`
- 不要求穷举所有参考文件，只记录主要来源

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
- 当前打开路径是 `v2` 时，不要把 `v3` 文档当成默认参考面
