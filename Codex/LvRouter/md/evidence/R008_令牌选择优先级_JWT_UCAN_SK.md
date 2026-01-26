# 主张
- R008：TokenAuth 按“钱包 JWT → UCAN → sk- 令牌”的顺序解析与选择。

# 证据
- 文件：`internal/transport/http/middleware/auth.go`
  - 函数/符号：`TokenAuth`
  - 行号范围：L155-L291
  - 片段概述：先尝试钱包 JWT，失败后判断 UCAN，最后回退到 sk- 令牌。

# 结论
- 请求的令牌类型决定了后续选择路径与默认 key 策略。

