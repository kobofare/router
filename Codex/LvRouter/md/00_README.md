# LvRouter 路由信息生命体 — 交接入口

## 1. 快速入口
- 交互总览（离线可打开）：`web/index.html`
- 文字总览：`md/01_big_picture.md`
- 证据库（可溯源结论）：`md/evidence/`
- 交接区（任务/问题/变更/安全）：`md/handoff/`

## 2. 阅读路径（建议顺序）
1) `md/01_big_picture.md`：系统边界与术语
2) `md/02_request_flow.md`：请求全链路
3) `md/03_routing_rules.md`：路由与选择顺序
4) `md/04_provider_forward.md`：上游转发细节
5) `md/05_key_acl_quota.md`：key/权限/额度
6) `md/06_healthcheck_failover.md`：健康探测与回退
7) `md/07_config_surface.md`：配置面与变更

## 3. 证据与可溯源
- 所有结论必须在 `md/evidence/` 有对应证据文件。
- 证据文件必须写明：代码路径 + 函数/符号名 + 行号范围（可近似）。

## 4. 安全与敏感信息
- 发现疑似密钥/Token：只记录在 `md/handoff/SECURITY.md`，不得扩散到其他文档。

