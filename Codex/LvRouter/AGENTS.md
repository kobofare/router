# LvRouter 信息生命体 — AGENTS.md（唯一权威指令）

## 0. 范围与硬性约束
- 本仓库根目录：`/root/code/router/router_new/Codex/LvRouter`。
- **只允许写入/修改本目录下文件**；对 `../../` 上层 router 代码只读，不做任何改动。
- 全部输出必须中文（代码/标识符除外）。
- 每个结论必须可溯源：给出“文件路径 + 关键函数/符号名 + 关键行号范围（可近似）”。
- 发现疑似密钥/token：**不得输出/提交**；需在 `md/handoff/SECURITY.md` 标红记录并建议清理。

## 1. 目录结构说明（必须保持）
### web/
- `web/index.html`：总览交互图谱（离线可打开，含搜索/点击/侧栏）。
- `web/graph.json`：图谱数据（节点/边/标签/链接），与 index 同步。
- `web/pages/`：概念页（每个概念一个 HTML，可回到总览）。
- `web/assets/`：纯本地 JS/CSS/图标等（**不得引用外网**）。

### md/
- `md/00_README.md`：交接入口，告诉人类/Codex 去哪里找什么。
- `md/01_big_picture.md`：MECE 总览（文字版 + 术语表）。
- `md/02_request_flow.md`：请求进入到返回的流程（顺序）。
- `md/03_routing_rules.md`：路由规则/选择顺序（含伪代码/决策树）。
- `md/04_provider_forward.md`：转发到上游 provider 机制（协议/headers/timeout/retry）。
- `md/05_key_acl_quota.md`：key/用户/分组/权限/额度判定。
- `md/06_healthcheck_failover.md`：健康探测与回退（探测点/熔断/降级）。
- `md/07_config_surface.md`：配置面（配置文件/环境变量/热更新）。
- `md/evidence/`：证据库（每条结论一份文件）。
- `md/handoff/`：交接区（任务清单/问题池/变更日志/安全提示）。

## 2. 工作流（强制）
- **每次回答前**：执行 `git pull --rebase`。
- **每次回答后**：将新增知识同步到 `md/` 与 `web/`，并完成 commit/push。
- **每个阶段完成**：`git pull --rebase` → 更新文档/网页 → **/review** → `git commit` → `git push`。
- /review 约定：
  - 至少检查 `git diff`，确认证据可溯源、无敏感信息、链接可离线打开。

## 3. 证据规范（必须执行）
- 任何路由规则/选择顺序/回退策略 **都必须**落到 `md/evidence/`。
- 每个证据文件格式：
  - **主张**：一句话结论（编号）。
  - **证据**：代码路径 + 函数/符号名 + 行号范围 + 关键片段概述。
  - **结论**：该规则如何影响路由/转发/回退。

## 4. 安全规范
- 不输出/提交任何密钥、token、私密配置。
- 发现疑似密钥：
  - 仅在 `md/handoff/SECURITY.md` 记录，使用红色标注并建议清理。
  - 其余文档只写“存在疑似密钥，已记录”。

## 5. 交接规范
- 为 CodexDev 团队准备：
  - **可执行探查任务清单** → `md/handoff/TASKS.md`
  - **问题池（待确认/不确定点）** → `md/handoff/QUESTIONS.md`
- 每次阶段产出需更新 `md/handoff/CHANGELOG.md`（新增知识点 + 未解决问题）。

