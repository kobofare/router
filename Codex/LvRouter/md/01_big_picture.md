# 01 Big Picture（MECE 总览）

## 系统边界（基于代码）
- 入口：二进制入口 `cmd/router/main.go:1-6 (main)` 调用 `internal/app/app.go:28-119 (Run)` 启动服务。
- HTTP 服务与路由注册：`internal/app/app.go:100-113 (Run)` 创建 gin 并调用 `internal/transport/http/router/main.go:18-47 (SetRouter)`。
- 主要职责：鉴权/令牌解析、路由选渠、上游转发、额度计费、健康监控与渠道禁用（见下方模块）。
- 依赖：DB/Redis 初始化在 `internal/app/app.go:40-76 (Run)`；HTTP 客户端/超时/代理在 `common/client/init.go:17-55 (Init)`。

## 关键模块（MECE）
- HTTP Server & 路由：`internal/app/app.go:100-119 (Run)`，`internal/transport/http/router/*.go (SetRouter/SetRelayRouter/SetApiRouter)`。
- 鉴权与令牌选择：`internal/transport/http/middleware/auth.go:155-352 (TokenAuth)`，`internal/admin/repository/token/repository.go:53-116 (GetFirstAvailable/ValidateUserToken)`。
- 路由/选渠：`internal/transport/http/middleware/distributor.go:20-111 (Distribute/SetupContextForSelectedChannel)`，`internal/admin/model/cache.go:228-255 (CacheGetRandomSatisfiedChannel)`，`internal/admin/repository/ability/repository.go:27-54 (GetRandomSatisfiedChannel)`。
- 转发执行：`internal/admin/controller/relay.go:26-107 (Relay)`，`internal/relay/controller/text.go:25-86 (RelayTextHelper)`，`internal/relay/adaptor/common.go:22-52 (DoRequestHelper/DoRequest)`。
- 计费/额度：`internal/relay/controller/helper.go:68-160 (preConsumeQuota/postConsumeQuota)`。
- 健康探测/禁用：`internal/admin/monitor/manage.go:11-56 (ShouldDisable/ShouldEnable)`，`internal/admin/monitor/metric.go:61-78 (Emit)`，`internal/admin/controller/channel/test.go:230-323 (testChannels/AutomaticallyTestChannels)`。
- 配置面：`common/config/config.go:104-180 (配置项定义)`，CORS 在 `internal/transport/http/middleware/cors.go:13-62 (CORS)`。

## 术语表（含可溯源入口）
- Channel：上游通道实体（含 key/baseURL/模型/分组/优先级等）`internal/admin/model/channel.go:17-39 (Channel)`。
- Ability：group+model+channel 的可用关系与优先级 `internal/admin/model/ability.go:5-11 (Ability)`。
- Group：用户分组，从用户缓存获取 `internal/admin/model/cache.go:59-74 (CacheGetUserGroup)`。
- Token/Key：调用令牌；验证/默认选择逻辑在 `internal/admin/repository/token/repository.go:53-116 (GetFirstAvailable/ValidateUserToken)`。
- Relay：请求转发与失败重试入口 `internal/admin/controller/relay.go:51-107 (Relay)`。
- Adaptor：不同 provider 的协议适配器，由 Relay 调用 `internal/relay/controller/text.go:55-69 (RelayTextHelper)` + `internal/relay/adaptor/common.go:22-39 (DoRequestHelper)`。

## 证据索引
- 路由规则证据：`md/03_routing_rules.md` + `md/evidence/`。

