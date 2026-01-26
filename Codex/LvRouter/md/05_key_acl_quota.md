# 05 Key / ACL / Quota 机制

## Key 校验与权限
- **令牌路径顺序**：`TokenAuth` 依次尝试钱包 JWT → UCAN → sk- 令牌（`internal/transport/http/middleware/auth.go:155-291`）。
- **默认 key 选择**：JWT/UCAN 选择最早可用 token（id asc）作为默认 key（`internal/transport/http/middleware/auth.go:206-225/264-281` + `internal/admin/repository/token/repository.go:53-67`）。
- **指定渠道权限**：仅管理员可通过 token 后缀指定渠道；普通用户会被拒绝（`internal/transport/http/middleware/auth.go:335-341`）。
- **模型白名单**：token.Models 不为空时，仅允许列表内模型（`internal/transport/http/middleware/auth.go:216-219/272-275/325-328`）。
- **网段限制**：token.Subnet 不为空时，需符合请求 IP（`internal/transport/http/middleware/auth.go:208-213/264-268/302-305`）。

## 额度/计费
- **预扣额度**：`preConsumeQuota` 读取用户额度并预扣（必要时 token 预扣），额度不足直接拒绝（`internal/relay/controller/helper.go:68-101`）。
- **后置扣减**：`postConsumeQuota` 根据 usage 计算实际消耗并更新用户/渠道使用量（`internal/relay/controller/helper.go:104-160`）。
- **用户额度缓存**：缓存读写与阈值刷新（`internal/admin/model/cache.go:89-105`）。

