# 项目说明

这是一个内核与系统设计文档仓，默认只关心 `docs/**/*.md`。

## Skill 维护约束

- 仓内保留两个独立 Skill：
  - `kernel-docs-system`
  - `kernel-code-to-docs`
- 每个 Skill 的规则必须完整维护在各自目录下的单个 `SKILL.md`
- 不要把 Skill 说明再拆到 `references/`、`agents/interface.yaml`、独立 eval 文档里
- `kernel-docs-system` 负责文档入口发现、元数据校验、旧文档空 YAML 头初始化和版本/领域落点判断
- `kernel-code-to-docs` 负责读代码后沉淀长期文档
- 项目级 `CLAUDE.md` 只保留仓库约束和维护规则，不内联 Skill 正文

## 文档规则

长期文档仓固定入口是 `~/kernel-docs`；如果实际仓库不在这个目录，安装脚本会维护同名软链接。
长期文档默认只写入 `~/kernel-docs/docs/<version>/<domain>/topic.md`，不要把长期文档写回当前代码仓的 `docs/`。

- 文档固定按领域目录分类：
  - `arch`
  - `memory`
  - `filesystem`
  - `dfx`
  - `debug`
  - `security`
  - `drivers`
- `process` 已并入 `arch`，不要再新增 `process` 目录
- 文档路径固定为 `~/kernel-docs/docs/<version>/<domain>/topic.md`
  - `docs/v2/<domain>/`：V2，Linux 线
  - `docs/v3/<domain>/`：V3，鸿蒙线
  - `docs/lite/<domain>/`：Lite 线
- 版本判定：
  - 仓名以 `hm-` 开头，或路径包含 `RTOS_V3_master`：`v3`
  - 路径包含 `RTOS_V2_master`，或路径 / 仓名包含 `kernel-5.x`：`v2`
  - `lite` 路径规则暂未固定；只有用户明确说明是 `lite` 时，按 `lite` 处理
- 阅读规则：
  - 当前打开路径是 `v2`：只看 `docs/v2/`
  - 当前打开路径是 `v3`：默认看 `docs/v3/`；只有用户明确要求 `v2` / `Linux` 时，才额外看 `docs/v2/`
  - 当前上下文是 `lite`：先看 `docs/lite/`；不够时再补看 `docs/v2/`；不看 `docs/v3/`
  - 路径无法判断版本：结合用户语义选择 `v2` / `v3` / `lite`
- `archive` 文档默认不展示，路径使用 `docs/archive/<domain>/`
- 不在这个仓里维护 plan / TODO 风格文档

## Front Matter

每篇 `docs/**/*.md` 至少包含：

- `summary`
- `read_when`

`read_when` 必须写清楚：**AI 在什么场景下应该优先读这篇文档**。

允许但不强制的字段可以自行补充，例如 `source`、`owner`、`updated_at`、`tags`。

`source` 的语义是“这篇文档主要基于什么材料写成”，不是必填路径：

- 临时、随手参考且无需追溯的材料，可以不写
- 参考文档时，只记录文档名，不要求记录仓库或路径
- 参考代码时，写 `git仓库名:仓内相对路径`
- 不要求穷举所有参考文件；精确文件路径和行号放正文

## 默认流程

1. 进入 `kernel-docs-system` 或 `kernel-code-to-docs` 前，先检查当前 `repo_root + branch` 今天是否已经成功执行过 `git pull --rebase`
2. 如果今天尚未成功 pull 且工作区干净，先执行 `git pull --rebase`；工作区不干净时停止并说明原因
3. 编写或修改文档前，先运行 `~/.claude/bin/docs-list`
4. 提交前运行 `~/.claude/bin/docs-lint`
5. 旧文档补空 YAML 头时运行 `~/.claude/bin/docs-init-frontmatter --write`
6. 本地提交默认依赖 `.githooks/pre-commit`
7. docs-only 任务默认走 `kernel-docs-system`
8. 如果缺少相关文档，`kernel-docs-system` 默认单向转交 `kernel-code-to-docs`
9. 代码调研沉淀任务默认走 `kernel-code-to-docs`，进入后直接复用 `docs-list` 与路由规则，不再回跳 `kernel-docs-system`
10. `kernel-code-to-docs` 发现文档与代码不一致时，默认按代码修正文档
11. `kernel-code-to-docs` 落盘后默认提交文档改动，并在 commit 成功后执行 `git mr --yes`
