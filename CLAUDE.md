# 项目说明

这是一个内核与系统设计文档仓，默认只关心 `docs/**/*.md`。

## 文档规则

- 文档固定按领域目录分类：
  - `arch`
  - `memory`
  - `filesystem`
  - `dfx`
  - `debug`
  - `security`
  - `drivers`
- `process` 已并入 `arch`，不要再新增 `process` 目录
- 代码调研文档直接写到对应领域目录，文件名建议使用 `code-reading-*.md`
- `archive` 文档默认不展示，路径使用 `docs/archive/<domain>/`
- 不在这个仓里维护 plan / TODO 风格文档

## Front Matter

每篇 `docs/**/*.md` 至少包含：

- `summary`
- `read_when`

`read_when` 必须写清楚：**AI 在什么场景下应该优先读这篇文档**。

允许但不强制的字段可以自行补充，例如 `source`、`owner`、`updated_at`、`tags`。

## 默认流程

1. 编写或修改文档前，先运行 `~/.claude/bin/docs-list /path/to/target-repo`
2. 提交前运行 `~/.claude/bin/docs-lint /path/to/target-repo`
3. 旧文档补格式时运行 `~/.claude/bin/docs-migrate /path/to/target-repo --write`
4. 本地提交默认依赖 `.githooks/pre-commit`
5. 仓内文档入口相关能力默认由 `kernel-docs-system` Skill 提供
