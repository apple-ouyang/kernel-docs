# Path And Routing

目标文档路径固定为：

- `docs/v2/<domain>/<topic>.md`
- `docs/v3/<domain>/<topic>.md`
- `docs/lite/<domain>/<topic>.md`

固定领域：

- `arch`
- `memory`
- `filesystem`
- `dfx`
- `debug`
- `security`
- `drivers`

归类补充：

- `process` 不单独建类
- 进程、线程、调度、启动、IPC 默认归 `arch`

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
