# 03 路由规则与选择顺序

## 决策树 / 伪代码（含入口引用）
```
// 入口：TokenAuth + Distribute + Relay
// internal/transport/http/router/relay.go:20-22
// internal/transport/http/router/api.go:113-115

TokenAuth(c):
  if Authorization 是钱包 JWT:
     解析用户 → 选默认 token (GetFirstAvailable, id asc)
  else if 是 UCAN:
     解析用户 → 选默认 token (GetFirstAvailable, id asc)
  else:
     解析 sk- token
  if token 指定渠道且为管理员:
     ctx.SpecificChannelId = 指定 id
  if path 参数含 channelid:
     ctx.SpecificChannelId = channelid

Distribute(c):
  if ctx.SpecificChannelId 存在:
     channel = GetChannelById(id)
     require channel.Status == Enabled
  else:
     group = CacheGetUserGroup(userId)
     model = ctx.RequestModel (必要时由请求默认补全)
     channel = CacheGetRandomSatisfiedChannel(group, model, ignoreFirstPriority=false)
  SetupContextForSelectedChannel(channel)

Relay(c):
  err = relayHelper(...)
  if err && shouldRetry(status) && !SpecificChannelId:
     for retryTimes:
        channel = CacheGetRandomSatisfiedChannel(group, originalModel, ignoreFirstPriority = (i!=retryTimes))
        if channel == lastFailed: continue
        SetupContextForSelectedChannel(channel)
        err = relayHelper(...)
```

> 入口引用：`internal/transport/http/middleware/auth.go:155-352 (TokenAuth)`、`internal/transport/http/middleware/distributor.go:20-111 (Distribute)`、`internal/admin/controller/relay.go:51-97 (Relay)`。

## 规则清单（每条对应证据文件）
- **R001 指定渠道优先**：若 `SpecificChannelId` 存在，直接用该渠道；渠道禁用则拒绝。证据：`md/evidence/R001_指定渠道优先与禁用校验.md`（`internal/transport/http/middleware/auth.go:335-348`；`internal/transport/http/middleware/distributor.go:28-43`）。
- **R002 分组+模型驱动选渠**：未指定渠道时，使用用户 group 与请求 model 选择可用渠道。证据：`md/evidence/R002_分组与模型驱动选渠.md`（`internal/transport/http/middleware/distributor.go:22-48`；`internal/admin/model/cache.go:59-74`；`internal/transport/http/middleware/auth.go:198-204/319-333`）。
- **R003 缓存优先级随机**：内存缓存下按 priority 分层，随机落在最高优先级；重试可跳过最高优先级。证据：`md/evidence/R003_缓存优先级随机策略.md`（`internal/admin/model/cache.go:204-255`）。
- **R004 DB 随机选渠**：无缓存时，`ignoreFirstPriority=false` 仅选最高优先级；为 true 则在所有启用渠道中随机。证据：`md/evidence/R004_DB随机选渠与优先级.md`（`internal/admin/repository/ability/repository.go:27-54`）。
- **R005 失败重试规则**：仅在未指定渠道且状态码为 429/5xx 时重试，按 `RetryTimes` 次数更换渠道并跳过上次失败渠道。证据：`md/evidence/R005_失败重试与跳过规则.md`（`internal/admin/controller/relay.go:70-97,111-127`）。
- **R006 错误触发禁用/熔断**：错误满足规则时自动禁用；否则进入指标队列，成功率低于阈值触发禁用。证据：`md/evidence/R006_错误触发禁用与指标熔断.md`（`internal/admin/controller/relay.go:130-137`；`internal/admin/monitor/manage.go:11-43`；`internal/admin/monitor/metric.go:18-37,61-78`）。
- **R007 定时健康测试**：按 `CHANNEL_TEST_FREQUENCY` 周期测试渠道，超时或错误可自动禁用；满足条件可自动启用。证据：`md/evidence/R007_定时通道测试自动禁用启用.md`（`internal/app/app.go:77-83`；`internal/admin/controller/channel/test.go:230-271,317-323`；`internal/admin/monitor/manage.go:46-56`）。
- **R008 令牌选择优先级**：TokenAuth 按“钱包 JWT → UCAN → sk-”顺序选择令牌路径。证据：`md/evidence/R008_令牌选择优先级_JWT_UCAN_SK.md`（`internal/transport/http/middleware/auth.go:155-291`）。
- **R009 令牌模型/网段限制**：token 的 subnet 与 models 白名单会限制请求模型与来源 IP。证据：`md/evidence/R009_令牌模型与网段权限限制.md`（`internal/transport/http/middleware/auth.go:208-220,264-276,302-329`）。
- **R010 请求模型默认补全**：特定路径会补全默认模型（moderations/embeddings/images/audio）。证据：`md/evidence/R010_请求模型默认值补全.md`（`internal/transport/http/middleware/utils.go:24-58`）。
- **R011 默认 key 选择**：JWT/UCAN 选取“最早可用 token（id asc）”作为默认 key。证据：`md/evidence/R011_默认Key选择_最早可用Token.md`（`internal/transport/http/middleware/auth.go:206-225,264-281`；`internal/admin/repository/token/repository.go:53-67`）。

## 两个 key 均可用时的策略（归纳）
- **JWT/UCAN**：只选择 `GetFirstAvailable` 返回的最早可用 token（id asc），不做轮询或权重选择（`internal/admin/repository/token/repository.go:53-67`）。
- **sk-**：请求携带哪个 token 就使用哪个 token（`internal/transport/http/middleware/auth.go:291-352`）。
- **渠道选择不粘性**：无“按用户/会话固定渠道”逻辑；每次请求在同优先级内随机（`internal/admin/model/cache.go:228-255`）。

