# 07 配置面（配置文件 / 环境变量 / 热更新）

## 配置来源
- **环境变量**：核心配置集中在 `common/config/config.go:104-180`（如 `RetryTimes`, `RelayTimeout`, `EnableMetric` 等）。
- **CORS 白名单**：`CORS_ALLOWED_ORIGINS` 读取至 `CorsAllowedOrigins`（`common/config/config.go:104-105`）并用于 `internal/transport/http/middleware/cors.go:13-62`。
- **前端代理与兼容开关**：`DISABLE_OPENAI_COMPAT`/`FRONTEND_BASE_URL` 在 `internal/transport/http/router/main.go:26-47`。
- **渠道测试周期**：`CHANNEL_TEST_FREQUENCY` 在 `internal/app/app.go:77-83` 生效。

## 生效机制
- **启动加载**：服务启动时由 `internal/app/app.go:28-119 (Run)` 读取并初始化各组件。
- **重试次数**：`RetryTimes` 在 `internal/admin/controller/relay.go:71-77` 读取并驱动重试。
- **上游超时/代理**：`RelayTimeout`/`RelayProxy` 在 `common/client/init.go:35-55` 生效。
- **指标熔断**：`EnableMetric`/`Metric*` 在 `internal/admin/monitor/metric.go:61-65` 控制指标消费者启动。

