# 06 健康探测与回退

## 探测点与策略
- **错误触发禁用**：Relay 失败后调用 `processChannelRelayError`，符合规则则自动禁用渠道（`internal/admin/controller/relay.go:130-137` + `internal/admin/monitor/manage.go:11-43`）。
- **指标熔断**：启用 `ENABLE_METRIC` 后，失败率低于阈值将触发自动禁用（`internal/admin/monitor/metric.go:18-37,61-78`）。
- **定时健康检查**：`CHANNEL_TEST_FREQUENCY` 启用后周期性测试渠道（`internal/app/app.go:77-83` + `internal/admin/controller/channel/test.go:317-323`）。

## 回退/降级
- **失败重试**：`Relay` 对 429/5xx 按 `RetryTimes` 进行重试并重新选渠（`internal/admin/controller/relay.go:70-97,111-127`）。
- **禁用/启用**：测试或错误触发禁用；当错误消失且满足规则可自动启用（`internal/admin/controller/channel/test.go:257-269` + `internal/admin/monitor/manage.go:46-56`）。

