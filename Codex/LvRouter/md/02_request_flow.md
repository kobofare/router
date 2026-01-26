# 02 请求流程（入站 → 返回）

## 流程分解（主干）
1) **服务启动与路由注册**：`internal/app/app.go:100-113 (Run)` 初始化 gin 与 middleware，并调用 `internal/transport/http/router/main.go:18-47 (SetRouter)` 组装 API/Relay 路由。
2) **进入 Relay 路由**：OpenAI 兼容路由 `/v1/*` 或 `/api/v1/public/*` 在 `internal/transport/http/router/relay.go:13-72 (SetRelayRouter)` 与 `internal/transport/http/router/api.go:106-165 (publicRelayRouter)` 统一挂载 `TokenAuth` + `Distribute`。
3) **令牌鉴权与模型解析**：`internal/transport/http/middleware/auth.go:155-352 (TokenAuth)` 解析 Authorization 并设置 `ctxkey.RequestModel/Id/TokenId`；模型默认值在 `internal/transport/http/middleware/utils.go:31-58 (getRequestModel)`。
4) **选渠与上下文注入**：`internal/transport/http/middleware/distributor.go:20-111 (Distribute/SetupContextForSelectedChannel)` 根据 group+model 或指定渠道选出 Channel，并写入 BaseURL、Key、模型映射等。
5) **Relay 入口与失败重试**：`internal/admin/controller/relay.go:51-97 (Relay)` 调用 `relayHelper`，失败时按 `shouldRetry` 重试并重新选渠。
6) **请求转发**：`internal/relay/controller/text.go:25-86 (RelayTextHelper)` 构建 meta、预扣额度、调用 adaptor 发送请求；底层 HTTP 由 `internal/relay/adaptor/common.go:22-52 (DoRequestHelper/DoRequest)` 驱动。
7) **响应与后置计费**：`internal/relay/controller/text.go:79-86 (RelayTextHelper)` 处理响应；额度后置扣减在 `internal/relay/controller/helper.go:104-160 (postConsumeQuota)`。

## 普通用户 + 默认 key + 无限制（典型路径）
- 入口：`/v1/chat/completions` 或 `/api/v1/public/chat/completions` 进入 `TokenAuth + Distribute`（`internal/transport/http/router/relay.go:20-26` / `internal/transport/http/router/api.go:113-138`）。
- 鉴权：使用 `sk-` 令牌时，`TokenAuth` 走“sk- 令牌”分支校验并写入 `ctxkey.Id/TokenId`（`internal/transport/http/middleware/auth.go:291-352`）。
- 模型解析：从请求体读取 model；必要时自动补全默认模型（`internal/transport/http/middleware/utils.go:31-58`）。
- 选渠：`Distribute` 读取用户 group 与请求模型，选择可用渠道（`internal/transport/http/middleware/distributor.go:22-48` + `internal/admin/model/cache.go:59-74`）。
- 转发：`Relay` → `RelayTextHelper` → adaptor 发送上游请求（`internal/admin/controller/relay.go:51-97` + `internal/relay/controller/text.go:25-86` + `internal/relay/adaptor/common.go:22-52`）。

## 两个 key 都可用（选择策略）
- **JWT/UCAN 场景**：`TokenAuth` 会“自动选择该用户的第一个可用 sk”作为默认 key（`internal/transport/http/middleware/auth.go:206-225` / `264-281`），实际选择规则为 `GetFirstAvailable` 的 **id asc**（最早可用）`internal/admin/repository/token/repository.go:53-67`。
- **sk- 场景**：请求头携带哪个 token 就使用哪个 token；不做轮询或权重选择（`internal/transport/http/middleware/auth.go:291-352`）。
- **预检/探测**：对 token 不做预检；对渠道健康由监控/测试机制维护（`internal/admin/monitor/manage.go:11-43` + `internal/admin/controller/channel/test.go:230-271`）。
- **sticky**：未发现按用户/会话粘性选渠逻辑；每次请求在同优先级内随机选渠（`internal/admin/model/cache.go:228-255`）。

## 证据索引
- 路由规则详见：`md/03_routing_rules.md` + `md/evidence/`。

