# Kernel Docs

一个面向内核与系统设计文档的小仓骨架。核心目标不是“把文档堆起来”，而是让 AI 和人都能先用 `summary` + `read_when` 选入口，再决定要不要深读正文。

## 快速开始

```bash
cd ~/code/kernel-docs
./scripts/install.sh
```

常用命令：

```bash
tsx scripts/docs-list.ts .
tsx scripts/docs-lint.ts .
tsx scripts/docs-migrate.ts . --write
node --test tests/*.test.mjs
```

## 目录规则

文档统一放在 `docs/` 下，按领域分类，不再单独拆 `research/`、`plans/`：

- `docs/arch/`: 架构、启动、调度、IPC、跨子系统机制
- `docs/memory/`: 页表、分配器、缺页异常、内存管理
- `docs/filesystem/`: VFS、文件系统实现、缓存一致性、IO 路径
- `docs/dfx/`: 日志、trace、观测、诊断、性能分析
- `docs/debug/`: GDB、崩溃分析、现场还原、调试方法
- `docs/security/`: 权限、隔离、认证、访问控制、安全加固
- `docs/drivers/`: 设备模型、总线、驱动框架、外设适配
- `docs/archive/<domain>/`: 默认不展示的归档文档

`process` 不再单独建类。进程、线程、调度、启动、IPC 默认归 `arch`。

## Front Matter

每篇 `docs/**/*.md` 至少包含：

```yaml
---
summary: 一句话说明这篇文档讲什么
read_when:
  - AI 需要判断这篇文档是否与当前任务相关时
---
```

`read_when` 的语义是：

- AI 在什么场景下应该优先阅读这篇文档
- 这段话会和所有文档的 `summary` 一起被聚合，作为入口筛选信息
- 适合写成“修改什么前”“排查什么时”“判断什么是否相关时”

不建议写成状态词、作者备注或空泛占位。

## Skill

这个仓里默认带两个独立 Skill：

- `kernel-docs-system`: 列文档、校验 front matter、迁移旧文档
- `kernel-code-research`: 读代码后，把调研结果直接写进对应领域目录

安装脚本会把这两个 Skill 安装到 Claude Code。
