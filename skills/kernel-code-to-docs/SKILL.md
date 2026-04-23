---
name: kernel-code-to-docs
description: Use when reading kernel, OS, or low-level system code and turning that code reading into a durable doc under `docs/`: choose the correct `version/domain`, decide whether to update or create a doc, extract the stable conclusions, and write the result as a reusable design note rather than a plan or TODO list.
---

# Kernel Code To Docs

把“读代码”沉淀成长期文档，不输出临时聊天结论、计划文档或 TODO 清单。

## When To Use

- 用户要你先读内核/系统代码，再整理成长期文档
- 目标是沉淀模块边界、调用链、约束和风险点
- 输出要进入 `docs/<version>/<domain>/`

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

## Stop Conditions

下面这些情况不要硬写：

- `version/domain` 还没判断清楚
- 还没判断该更新旧文还是新建
- 证据不足以支撑结论
- 用户真正要的是归档、迁移步骤或计划

## References

按需读取，不要一次全开：

- `references/path-and-routing.md`
- `references/extraction-checklist.md`
- `references/doc-structure.md`

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
