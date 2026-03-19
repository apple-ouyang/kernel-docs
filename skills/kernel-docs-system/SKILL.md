---
name: kernel-docs-system
description: Use when working in repositories that treat kernel and system docs as a first-class system. Use this whenever you need to list `docs/**/*.md`, choose which doc to read based on `summary` and `read_when`, lint document metadata, or migrate old markdown files into the shared docs format before further research or writing.
---

# Docs System

## Overview

把 `docs/` 当成一等公民来维护。先列出文档入口，再根据 `summary` 和 `read_when` 决定读哪些文档；写文档前先校验元数据，旧文档再按统一格式迁移。

## When To Use

- 编码前，想先看当前仓库有哪些长期文档入口
- 需要根据 `summary` 和 `read_when` 选择该读哪篇文档
- 新增或维护 `docs/` 下的 markdown，希望统一 front matter
- 旧文档没有 front matter，需要批量补模板

## Fixed Rules

- 扫描范围固定为 `docs/**/*.md`
- 领域目录固定为：
  - `arch`
  - `memory`
  - `filesystem`
  - `dfx`
  - `debug`
  - `security`
  - `drivers`
- `archive` 文档默认隐藏，只有显式加 `--all` 才展示
- 不使用 `plan` / `research` 深目录；代码调研文档直接放到对应领域目录
- `process` 分类已经并入 `arch`

## Commands

- 列出文档：`@scripts/docs-list.ts [repo-root] [--all]`
- 校验元数据：`@scripts/docs-lint.ts [repo-root] [--files <path...>]`
- 为旧文档补模板：`@scripts/docs-migrate.ts [repo-root] [--files <path...>] --write`

## Front Matter

推荐最小模板：

```yaml
---
summary: 一句话说明这篇文档的用途
read_when:
  - AI 需要判断这篇文档是否与当前任务相关时
---
```

`read_when` 的语义不是“作者什么时候写它”，也不是“这个文档的状态”，而是：

- **AI 在什么场景下应该优先读这篇文档**
- 这段文本会和所有文档的 `summary` 一起聚合，供 AI 先做入口筛选
- 所以应该写成“任务涉及什么 / 判断什么前 / 修改什么前”，而不是空泛的备注

## Common Patterns

- 架构、启动、调度、IPC、跨子系统机制：放 `docs/arch/`
- 内存管理、页表、分配器、缺页异常：放 `docs/memory/`
- VFS、具体文件系统实现、缓存一致性：放 `docs/filesystem/`
- 日志、trace、观测、诊断链路：放 `docs/dfx/`
- GDB、crash 分析、现场定位、调试手册：放 `docs/debug/`
- 权限、隔离、认证、加固：放 `docs/security/`
- 设备模型、总线、驱动框架、外设适配：放 `docs/drivers/`
- 代码调研文档命名建议：`code-reading-*.md`

## Common Mistakes

- 只看 `docs/` 根目录，不扫子目录
- 把 `read_when` 写成“待补充”“这篇先不看”这类无筛选价值的句子
- 重新发明 `process` 目录，而不是放回 `arch`
- 把代码调研又塞回 `docs/research/`

## Notes

脚本实现位于当前 skill 的 `scripts/`。仓库级安装入口是根目录的 `scripts/install.sh`，会依次做环境检查、安装本地 pre-commit，并把 `kernel-docs-system` 和 `kernel-code-research` 安装到 Claude Code。
