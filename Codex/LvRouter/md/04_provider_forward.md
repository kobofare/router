# 04 上游 Provider 转发机制

## 协议与路由（核心链路）
- **元数据构建**：`internal/relay/meta/relay_meta.go:44-71 (GetByContext)` 读取 ctx 中的 Channel/Token/Group/BaseURL/ModelMapping 等；若 BaseURL 为空，则回退到内置默认（`internal/relay/meta/relay_meta.go:64-70`）。
- **请求头处理**：`internal/relay/adaptor/common.go:14-19 (SetupCommonRequestHeader)` 透传 `Content-Type/Accept`，流式请求默认 `Accept: text/event-stream`。
- **上游 URL**：`internal/relay/adaptor/common.go:22-39 (DoRequestHelper)` 通过 adaptor 的 `GetRequestURL` 生成完整上游地址，再创建 HTTP 请求。
- **上游 key**：`internal/transport/http/middleware/distributor.go:81-84 (SetupContextForSelectedChannel)` 将 channel.Key 写入 Authorization，供 adaptor 使用；meta 中读取该 header（`internal/relay/meta/relay_meta.go:59-60`）。

## 超时 / 代理 / 客户端
- **HTTP Client**：上游请求使用 `common/client` 的 `HTTPClient`（`internal/relay/adaptor/common.go:42-52`）。
- **超时与代理**：`common/client/init.go:35-55 (Init)` 支持 `RELAY_TIMEOUT` 与 `RELAY_PROXY`，并创建带超时/代理的 HTTPClient。

## 重试与失败处理
- **重试不在 adaptor 内**，由上层 `internal/admin/controller/relay.go:70-97 (Relay)` 触发并重新选渠。

