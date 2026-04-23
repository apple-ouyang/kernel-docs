# Domain Map

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

归类规则：

- 架构、启动、调度、IPC、跨子系统机制：`arch`
- 内存管理、页表、分配器、缺页异常：`memory`
- VFS、具体文件系统实现、缓存一致性：`filesystem`
- 日志、trace、观测、诊断链路：`dfx`
- GDB、crash 分析、现场定位、调试手册：`debug`
- 权限、隔离、认证、加固：`security`
- 设备模型、总线、驱动框架、外设适配：`drivers`

补充规则：

- `process` 已并入 `arch`
- 长期文档路径固定为 `docs/<version>/<domain>/`
- 归档路径固定为 `docs/archive/<domain>/`
