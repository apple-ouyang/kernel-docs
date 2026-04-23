---
name: kernel-code-to-docs
description: >
  Use when reading kernel, OS, or low-level system code and turning that code reading into a durable
  doc under `docs/`: choose the correct `version/domain`, decide whether to update or create a doc,
  extract the stable conclusions, and write the result as a reusable design note rather than a plan
  or TODO list. Do not use for docs-only entrypoint maintenance, metadata lint or migrate tasks, or
  archive and knowledge-lift work.
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

1. 先检查当前 `repo_root + branch` 今天是否已经成功执行过 `git pull --rebase`
2. 如果今天尚未成功 pull，且工作区干净，则先执行 `git pull --rebase`
3. 调用 `kernel-docs-system` 看现有文档入口
4. 判断这次调研的 `version/domain`
5. 抽查同主题文档，决定是更新原文还是新建
6. 读代码并提炼稳定结论
7. 如果发现现有文档与代码不一致，以代码为准修改文档
8. 先写结论，再补证据索引和风险点
9. 运行 `docs-lint` 校验目标文档
10. 用一条原子 git 命令提交本次文档改动
11. commit 成功后执行 `git mr --yes`

## Core Rules

- 每次进入本 Skill，先做一次每日 `git pull --rebase` 检查，再开始读文档或读代码
- 每日 pull 的频率按“自然日 + `repo_root + branch`”控制，状态记录在 `~/.claude/kernel-docs-pull-state.json`
- 只有成功 pull 才更新每日状态；失败不算完成
- 不要把输出写成计划文档
- 不要单独创建 `research/` 目录
- 代码是事实真源；代码与文档冲突时，必须以代码为准修正文档
- 结论先讲清楚，再补证据路径
- 如果已有同主题文档，优先更新原文，而不是新建重复文档
- 即使已经存在同主题文档，只要内容与代码不一致，也必须更新该文档并提交
- 不确定点写进风险点，不要转成 TODO 清单
- 文档路径固定为 `~/kernel-docs/docs/<version>/<domain>/topic.md`
- `process` 不单独建类，进程、线程、调度、启动、IPC 默认归 `arch`
- 目标文档落盘后必须提交，不能只停留在工作区
- 不要假设存在额外的 commit Skill、helper 或封装脚本；提交要求直接由本 Skill 明确给出
- commit 成功后必须继续执行 `git mr --yes`

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

如果已有文档，额外检查这些差异：

- 模块边界是否已经变化
- 数据结构字段、状态机或生命周期是否已经变化
- 调用链、锁语义、并发语义是否已经变化
- 接口约束、前置条件、错误路径是否已经变化
- 文档中的结论是否已经被代码推翻

## Commit And MR

- commit 标题默认使用 `docs(<domain>): <补充或更新><主题>文档`
- `<domain>` 只在能清楚表达领域时填写，例如 `docs(memory): 补充页表切换文档`
- 正文至少包含“原因：”和“改动：”两段；只有存在兼容性或迁移影响时再补“影响：”
- 提交必须通过一条原子 git 命令完成，命令中显式列出目标路径，不要依赖 repo-wide staging
- 提交路径必须显式列出本次修改的文档和必要的引用修复文件，禁止 repo-wide 提交
- `git mr --yes` 放在 commit 成功之后执行；如果失败，保留 commit 并明确报告失败

推荐 commit message 模板：

```text
docs(<domain>): <补充或更新><主题>文档

原因：
- 当前问题缺少可复用的长期文档入口

改动：
- 新建或更新目标主题文档
- 补充稳定结论、证据索引与风险点

影响：
- 后续同主题问题可先从长期文档入口读取
```

## Stop Conditions

下面这些情况不要硬写：

- `version/domain` 还没判断清楚
- 还没判断该更新旧文还是新建
- 证据不足以支撑结论
- 用户真正要的是归档、迁移步骤或计划
- 今天还没成功 pull，但当前工作区不干净，无法安全执行 `git pull --rebase`

## Output Contract

默认输出的文档或结论必须明确包含：

- 目标路径
- 为什么是这个版本目录
- 为什么是这个领域目录
- 主要参考了哪些代码路径
- 已经确定的结论
- 还不能拍板的风险点
- 如果发现代码与文档不一致，哪些结论已按代码修正
- 是否执行了每日 pull 检查，以及结果是什么
- commit message 应该采用什么标题

## Done Criteria

- 已明确是更新原文还是新建
- 如果发现文档过期，已按代码修正文档并提交
- 文档先讲结论，再给证据
- 当前实现和历史参考没有混写
- 风险点写清楚了边界
