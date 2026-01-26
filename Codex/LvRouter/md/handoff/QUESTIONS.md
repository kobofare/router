# 问题池（待确认/不确定点）

- Channel 的 `Weight` 字段是否在运行时有外部调度逻辑？代码内未发现使用点（`internal/admin/model/channel.go:23` 仅定义）。
- 某些 adaptor 是否存在“特定错误码不触发重试/禁用”的差异化策略？需逐个 adaptor 对照（`internal/relay/adaptor/*`）。
- 是否存在运行时动态调整 `RetryTimes/EnableMetric` 的管理接口或热更新机制？目前仅看到配置读取点（`common/config/config.go:122,161`）。

