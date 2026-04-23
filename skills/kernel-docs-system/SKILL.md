---
name: kernel-docs-system
description: Use when working in repositories that treat kernel and system docs as a first-class system. Use this whenever you need to list `docs/**/*.md`, choose which doc to read based on `summary` and `read_when`, lint document metadata, or migrate old markdown files into the shared docs format before further research or writing.
---

# Docs System

## Overview

把 `docs/` 当成一等公民来维护。先列出文档入口，再根据 `summary` 和 `read_when` 决定读哪些文档；写文档前先校验元数据，旧文档再按统一格式迁移。重点不是“补一个 YAML 头”，而是让 `summary` 和 `read_when` 真正承担入口路由：回答这篇文档帮助做什么判断、什么场景该先读它。

## When To Use

- 编码前，想先看当前仓库有哪些长期文档入口
- 需要根据 `summary` 和 `read_when` 选择该读哪篇文档
- 新增或维护 `docs/` 下的 markdown，希望统一 front matter
- 旧文档没有 front matter，需要批量补模板
- 需要判断某篇文档应该落到哪个版本目录和领域目录

## Execution Modes

- `Discover`
  - 列入口
  - 根据 `summary` 和 `read_when` 推荐先读哪些文档
  - 需要时用 `--version`、`--domain`、`--json` 缩小范围
- `Lint`
  - 校验路径、front matter、占位 `summary`、空泛 `read_when`
  - 默认优先用于提交前或批量修改后
- `Migrate`
  - 只给旧文档补最小 front matter 外壳
  - 不顺手重写正文，不把迁移偷换成语义改写
- `Route`
  - 判断一篇文档该落到哪个 `version/domain`
  - 先判断版本，再判断领域，再决定是否需要读同主题旧文档

如果用户没有显式说明，默认先走 `Discover`。

## Fixed Rules

- 扫描范围固定为 `docs/**/*.md`
- 版本目录固定为：
  - `v2`
  - `v3`
  - `lite`
- 领域目录固定为：
  - `arch`
  - `memory`
  - `filesystem`
  - `dfx`
  - `debug`
  - `security`
  - `drivers`
- `archive` 文档默认隐藏，只有显式加 `--all` 才展示
- `archive` 是生命周期，不是版本维度；归档路径固定为 `docs/archive/<domain>/`
- 不使用 `plan` / `research` 深目录；文档直接放到 `docs/<version>/<domain>/`
- `process` 分类已经并入 `arch`
- 任何“文档入口发现”必须先走 `docs-list`；不要用 `rg`、`grep`、`find` 直接扫描 `docs/` 来决定先读哪些文档
- `rg` / `grep` 只允许在 `docs-list` 已锁定候选文档后，用于正文内的定点检索；不要跳过入口路由直接全文扫
- 归档前先判断是否需要知识上浮：当前仍然有效的架构规则、命令入口、调试流程、数据约束，不能只留在 `archive`
- `docs-migrate.ts` 只负责补最小 front matter 外壳，不负责完整语义迁移
- 大批量旧文档迁移默认拆成不重叠的小批次处理，不要在单个上下文里硬吃几十篇文档
- `summary` 必须优先回答“这篇文档帮助做什么决策 / 操作”，不要只是改写标题
- `summary` 不能写成 `TODO`、`待补充`、`占位` 这类占位词
- `read_when` 必须写成任务触发语句，最好接近用户会说的话，不要写成空泛短语
- `read_when` 不能只写“修改前”“需要时”“排查时”这类没有筛选力的话
- `docs-list` 只保留入口路由信息：分组、路径、`summary`、`read_when`、archive 轻提示；不要把正文预览或完整 front matter 混进首屏

## Stop Conditions

遇到下面几种情况，不要继续在这个 skill 里硬做：

- 用户真正要的是归档、知识上浮、修复错误归档
- 目标不是 `docs/` 入口系统，而是代码调研沉淀
- 文档落点还没判断清楚，但已经准备直接新建文件
- 用户试图直接全文扫描 `docs/` 决定读哪篇，先切回 `docs-list`

这几类情况要么切到归档流程，要么切到 `kernel-code-to-docs`。

## Commands

- 列出文档：`~/.claude/bin/docs-list [repo-root] [--all] [--version <v2|v3|lite>] [--domain <domain>] [--json]`
- 校验元数据：`~/.claude/bin/docs-lint [repo-root] [--files <path...>]`
- 为旧文档补模板：`~/.claude/bin/docs-migrate [repo-root] [--files <path...>] --write`

## Front Matter

推荐最小模板：

```yaml
---
summary: 一句话说明这篇文档帮助完成什么判断或操作
read_when:
  - 遇到什么任务、决策或排障场景时先读
---
```

`read_when` 的语义不是“作者什么时候写它”，也不是“这个文档的状态”，而是：

- **AI 在什么场景下应该优先读这篇文档**
- 这段文本会和所有文档的 `summary` 一起聚合，供 AI 先做入口筛选
- 所以应该写成“任务涉及什么 / 判断什么前 / 修改什么前”，而不是空泛的备注

推荐写法：

- `summary`：优先写“作用 + 决策对象”，例如“定义缺页异常排查时先看哪些现场与寄存器”
- `read_when`：优先写成任务触发语句，例如“排查 slab 分配异常前”“判断这个问题属于 VFS 还是具体文件系统实现时”

避免写法：

- `summary` 只重复标题
- `summary` 写成 `TODO`、`待补充`、`占位`
- `read_when` 只写“修改前”“需要时”“排查时”
- `read_when` 留 `TODO`

## Common Patterns

- 架构、启动、调度、IPC、跨子系统机制：放 `docs/<version>/arch/`
- 内存管理、页表、分配器、缺页异常：放 `docs/<version>/memory/`
- VFS、具体文件系统实现、缓存一致性：放 `docs/<version>/filesystem/`
- 日志、trace、观测、诊断链路：放 `docs/<version>/dfx/`
- GDB、crash 分析、现场定位、调试手册：放 `docs/<version>/debug/`
- 权限、隔离、认证、加固：放 `docs/<version>/security/`
- 设备模型、总线、驱动框架、外设适配：放 `docs/<version>/drivers/`
- 文件名直接使用主题名，版本由目录表达
- `source` 是可选来源说明，不是必填路径
- 归档文档放 `docs/archive/<domain>/`，不要再带版本目录

## Version Routing

根据当前打开路径、当前工作区路径或用户明确给出的路径判断默认版本：

- 仓名以 `hm-` 开头：`v3`
- 绝对路径包含 `RTOS_V3_master`：`v3`
- 绝对路径包含 `RTOS_V2_master`：`v2`
- 路径或仓名包含 `kernel-5.x`：`v2`
- `lite` 路径规则暂未固定；当前只有用户明确说是 `lite` 时，才按 `lite` 处理

选择文档时遵循非对称规则：

- 当前路径命中 `v2`：只看 `docs/v2/`
- 当前路径命中 `v3`：默认看 `docs/v3/`；只有用户明确要求看 `v2` / `Linux` 时，才额外看 `docs/v2/`
- 当前上下文是 `lite`：先看 `docs/lite/`；不够时再补看 `docs/v2/`；不看 `docs/v3/`
- 当前路径无法判断版本：根据用户提到的 `V2` / `Linux` / `V3` / `鸿蒙` / `lite` 选择版本文档
- 需要追历史实现或废弃方案时，再额外看 `docs/archive/`

`source` 的格式建议：

- 参考文档：只写文档名
- 参考代码：写 `git仓库名:仓内相对路径`
- 不要求穷举所有参考文件，只写主要来源

## Output Contract

默认输出必须至少回答下面一项：

- 这次应该先读哪些 active docs
- 哪些文件元数据不合规
- 哪些旧文档已补最小模板
- 某篇文档更适合哪个 `version/domain`

如果给的是推荐列表，不要只贴路径，还要写“为什么先读它”。

## Done Criteria

- 入口发现类任务：只看这次输出，就能决定下一篇该读什么
- 元数据校验类任务：问题文件、问题类型、下一步动作都明确
- 迁移类任务：正文原样保留，只补最小外壳
- 路由类任务：版本和领域判断都有依据，不是拍脑袋

## Common Mistakes

- 只看 `docs/` 根目录，不扫子目录
- 把 `archive` 当成版本目录的一部分，而不是统一生命周期目录
- 归档前不做知识上浮，导致当前仍有效的信息只留在历史文档里
- 把 `read_when` 写成“待补充”“这篇先不看”这类无筛选价值的句子
- 重新发明 `process` 目录，而不是放回 `arch`
- 把代码调研又塞回 `docs/research/`

## Notes

脚本实现位于当前 skill 的 `scripts/`。仓库级安装入口是根目录的 `scripts/install.sh`，会依次做环境检查、安装本地 pre-commit，并把 `kernel-docs-system` 和 `kernel-code-to-docs` 安装到 Claude Code。
