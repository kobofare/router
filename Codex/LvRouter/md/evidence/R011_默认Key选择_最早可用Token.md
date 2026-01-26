# 主张
- R011：JWT/UCAN 场景下，系统会选择“最早可用 token（id asc）”作为默认 key。

# 证据
- 文件：`internal/transport/http/middleware/auth.go`
  - 函数/符号：`TokenAuth`
  - 行号范围：L206-L225 / L264-L281
  - 片段概述：调用 `GetFirstAvailableToken` 作为默认 token。
- 文件：`internal/admin/repository/token/repository.go`
  - 函数/符号：`GetFirstAvailable`
  - 行号范围：L53-L67
  - 片段概述：过滤 enabled/未过期/有额度，并 `Order("id asc")` 取最早 token。

# 结论
- 当用户有多个可用 token 时，默认 key 的选择是确定性的（最早创建优先）。

