# CodexDev 可执行探查任务清单

> 说明：每条任务需明确“目标 + 入口文件 + 预期产出”。

## 下一步任务（建议）
1) 梳理 adaptor 差异：逐个 provider 的 header/路径/错误处理差异（入口：`internal/relay/adaptor/*`）。
2) 验证 weight/灰度策略是否存在：搜索 `Weight` 与灰度开关（入口：`internal/admin/model/channel.go` + 全局 rg）。
3) 复核配置热更新：是否有接口或 watcher 触发配置刷新（入口：`internal/admin/controller/option/*` + `model.SyncOptions`）。
4) 完善风险与结论页：汇总关键单点风险与回退建议（产出：`md/handoff/CHANGELOG.md` 与新增风险清单）。

