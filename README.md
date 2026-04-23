# Kernel Docs

一个面向内核与系统设计文档的小仓骨架。核心目标不是“把文档堆起来”，而是让 AI 和人都能先用 `summary` + `read_when` 选入口，再决定要不要深读正文。

## 快速开始

在仓库根目录执行：

```bash
./scripts/install.sh
```

推荐直接把仓库放在 `~/kernel-docs`。
如果实际 clone 到别的位置，安装脚本会自动在用户目录下创建或更新 `~/kernel-docs` 软链接，后续 README、Skill 和全局提示词都统一以这个固定入口为准。

常用命令：

```bash
~/.claude/bin/docs-list
~/.claude/bin/docs-list --version v3 --domain memory
~/.claude/bin/docs-list --json
~/.claude/bin/docs-lint
~/.claude/bin/docs-init-frontmatter --write
node --test tests/*.test.mjs
```

这些命令分别用于：

- `docs-list`: 列出目标仓 `docs/` 下当前可参考的文档入口，默认隐藏 `archive`，可按 `version/domain` 缩小范围，必要时输出 JSON
- `docs-lint`: 校验目标仓文档的 front matter 是否满足约定，也会拦截 `TODO`、`待补充`、`修改前` 这类没有筛选价值的占位写法
- `docs-init-frontmatter`: 给旧文档补齐空的 YAML front matter 外壳，或为已有 YAML 头的文档补齐缺失字段，可配合 `--write` 直接落盘
- `node --test tests/*.test.mjs`: 验证安装脚本、文档脚本和元数据规则没有回归

如果系统里没有 `tsx`，脚本会自动先尝试 `npm install -g tsx`，失败后再回退到 `~/.claude/tools/tsx` 里的用户目录安装；两种方式都失败时，才提示手工安装。
文档操作的推荐入口固定是 `~/.claude/bin/docs-*`。不传仓路径时，这些命令默认操作 `~/kernel-docs`；如果你需要处理别的文档仓，仍然可以显式传目标路径。这样即使你当前人在别的代码仓里，也不会把文档误写回代码仓。

## 安装内容

`./scripts/install.sh` 会安装或配置这些内容：

- 运行环境检查：确认 `node`、`npm`、`npx`、`git` 可用，并确保 `tsx` 可运行
- 本仓 pre-commit：将当前仓的 `core.hooksPath` 指向 `.githooks`
- Runtime skills：如果以下目录存在，就直接用 `cp` 覆盖安装这两个 Skill
  - `~/.claude/skills`
  - `~/.agents/skills`
  - `~/.opencode/skills`
- 全局命令：安装 `~/.claude/bin/docs-list`、`docs-lint`、`docs-init-frontmatter`
- 全局提示词：把受管的 Docs 规则写入 `~/.claude/CLAUDE.md`
- 全局环境文件：写入 `~/.claude/kernel-docs.env`，让全局命令知道当前 `kernel-docs` 仓的位置
- 稳定仓入口：如果当前仓不在 `~/kernel-docs`，就创建或更新这个软链接，供 README、Skill 和提示词统一引用

## 目录规则

文档统一放在 `docs/` 下，先按操作系统线，再按领域分类：

- `docs/v2/<domain>/`: V2，Linux 线
- `docs/v3/<domain>/`: V3，鸿蒙线
- `docs/lite/<domain>/`: Lite 线
- `docs/<version>/archive/<domain>/`: 默认不展示的归档文档

`process` 不再单独建类。进程、线程、调度、启动、IPC 默认归 `arch`。

命名建议：

- 文件名直接使用主题名即可，例如 `page-fault.md`
- 版本差异由目录表达，不再靠文件名前缀区分
- 同主题可以分别存在于 `v2/`、`v3/`、`lite/` 目录下

版本判定规则：

- 仓名以 `hm-` 开头：判定为 `v3`
- 绝对路径包含 `RTOS_V3_master`：判定为 `v3`
- 绝对路径包含 `RTOS_V2_master`：判定为 `v2`
- 路径或仓名包含 `kernel-5.x`：判定为 `v2`
- `lite` 代码仓规则暂未固定；当前只有在用户明确说是 `lite` 时，才按 `lite` 处理

阅读规则：

- 当前打开路径命中 `v2`：只看 `docs/v2/`，默认不看 `docs/v3/` 或 `docs/lite/`
- 当前打开路径命中 `v3`：默认看 `docs/v3/`；只有用户明确要求参考 `v2` / `Linux` 时，才额外看 `docs/v2/`
- 当前上下文被判定为 `lite`：先看 `docs/lite/`；不够时再补看 `docs/v2/`；默认不看 `docs/v3/`
- 当前路径无法判断版本：先根据用户提到的 `V2` / `Linux` / `V3` / `鸿蒙` / `lite` 选择版本目录

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

`source` 如果需要写，语义是“这篇文档主要基于什么材料写成”，不是必须保存一个路径。

- 随手放置、后续不需要追溯的临时材料，可以不写 `source`
- 如果主要参考已有文档，记录文档名即可，不要求记录文档所在仓库或路径
- 如果主要参考代码，写成 `git仓库名:仓内相对路径`
- 不要求穷举所有参考文件，只记录主要来源；具体证据路径和行号放正文，不放 front matter

例如：

```yaml
---
summary: V3 页故障处理链路梳理
read_when:
  - 修改 V3 缺页异常处理前
source:
  - hm-verif-kernel: kernel/base/mm
  - 《内存管理设计说明》
---
```

## Skill

这个仓里默认带两个独立 Skill：

- `kernel-docs-system`: 负责先做每日同步检查，再做文档入口发现、元数据校验、旧文档空 YAML 头初始化和版本/领域落点判断；如果缺少相关文档，默认单向转交 `kernel-code-to-docs`
- `kernel-code-to-docs`: 负责先做每日同步检查、再按 `docs-list` 与路由规则确认入口、再读代码、按代码修正文档、最后沉淀成长期文档，并在落盘后提交文档改动、执行 `git mr --yes`

默认同步规则：

- 每次进入任一 Skill，都先检查当前 `repo_root + branch` 今天是否已经成功执行过 `git pull --rebase`
- 同一个 `repo_root + branch` 在同一个自然日最多成功 pull 一次
- pull 状态记录在 `~/.claude/kernel-docs-pull-state.json`
- 如果今天尚未成功 pull 且工作区干净，则先执行 `git pull --rebase`
- 如果工作区不干净，则停止并报告无法安全 rebase

默认文档提交模板：

- 标题：`docs(<domain>): <补充、更新或纠正><主题>文档`
- 正文至少包含“原因：”和“改动：”，必要时补“影响：”

默认真源规则：

- 代码是事实真源；如果已有文档与代码不一致，优先修改文档，不保留与代码冲突的描述

安装脚本会在运行时目录已存在时，直接把这两个 Skill 复制覆盖到对应目录；不存在就跳过，不会强行创建新的 host 运行时目录。
它也会安装 `~/.claude/bin/docs-list`、`docs-lint`、`docs-init-frontmatter`，同步全局 `~/.claude/CLAUDE.md` 里的 Docs 提示词，并确保长期文档仓固定入口可见为 `~/kernel-docs`。项目级维护规则直接写在仓内 `CLAUDE.md`，并由 `AGENTS.md` 软链接过去。

## 卸载

如果要撤销这套安装，执行：

```bash
./scripts/uninstall.sh
```

卸载脚本会：

- 移除全局 `docs-*` wrapper 和 `~/.claude/kernel-docs.env`
- 清掉全局 `~/.claude/CLAUDE.md` 里的受管 Docs 区块
- 撤销本仓 `core.hooksPath=.githooks`
- 卸载复制到运行时目录的两个 Skill
- 如果 `~/kernel-docs` 是安装脚本为当前仓创建的软链接，一并移除

它不会删除共享的 `tsx` 运行时。
