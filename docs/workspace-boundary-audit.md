# 管理工作区 / 用户工作区边界清单

更新时间：2026-06-05

## 目标

把当前前端页面明确分为三类：

1. 管理工作区：运营、配置、排障、审计
2. 用户工作区：消费、充值、令牌、个人记录
3. 混杂待拆分：同一页面或组件同时服务两种语境，后续需要继续拆边界

这份清单不是视觉稿，而是后续页面拆分、告警归属、文案收敛的依据。

## 判断规则

- 管理工作区关心平台资源、渠道路由、上游健康、全局计费、任务调度、用户运营
- 用户工作区关心个人余额、套餐、令牌、订单、调用记录、个人任务
- 如果同一个页面需要根据路由前缀切换数据源、面包屑、动作权限或告警内容，则视为混杂待拆分

## 当前路由盘点

### 管理工作区

来自 [web/src/App.jsx](/Users/liuxin2/Workspace/opensource/router/web/src/App.jsx:501) 的 `/admin/*` 路由：

- `/admin/dashboard`
- `/admin/provider`
- `/admin/channel`
- `/admin/channel/detail/:id`
- `/admin/channel/add`
- `/admin/channel/tasks`
- `/admin/channel/tasks/:id`
- `/admin/group`
- `/admin/group/detail/:id`
- `/admin/package`
- `/admin/package/detail/:id`
- `/admin/topup`
- `/admin/flow/topup`
- `/admin/flow/topup/:id`
- `/admin/flow/topup-reconcile`
- `/admin/flow/topup-reconcile/:id`
- `/admin/flow/package`
- `/admin/flow/package/:id`
- `/admin/flow/redemption`
- `/admin/flow/redemption/:id`
- `/admin/redemption`
- `/admin/redemption/:id`
- `/admin/redemption/add`
- `/admin/user`
- `/admin/user/detail/:id`
- `/admin/user/add`
- `/admin/log`
- `/admin/log/:id`
- `/admin/task`
- `/admin/task/:id`
- `/admin/setting`

这些页面对应的管理导航也已经单独收敛在 [web/src/constants/adminMenu.js](/Users/liuxin2/Workspace/opensource/router/web/src/constants/adminMenu.js:1)。

### 用户工作区

来自 [web/src/App.jsx](/Users/liuxin2/Workspace/opensource/router/web/src/App.jsx:359) 的 `/workspace/*` 路由：

- `/workspace/entry`
- `/workspace/start`
- `/workspace/chat`
- `/workspace/dashboard`
- `/workspace/service/pricing`
- `/workspace/service/help`
- `/workspace/token`
- `/workspace/token/:id`
- `/workspace/token/add`
- `/workspace/topup`
- `/workspace/topup/orders/:id`
- `/workspace/log`
- `/workspace/log/:id`
- `/workspace/task`
- `/workspace/task/:id`
- `/workspace/setting`

这些页面对应的用户导航已经单独收敛在 [web/src/constants/userMenu.js](/Users/liuxin2/Workspace/opensource/router/web/src/constants/userMenu.js:1)。

## 页面归类

### 明确属于管理工作区

- `AdminDashboard`
- `Providers`
- `Channel` / `EditChannel` / `AddChannel`
- `Group`
- `Package` / `PackageDetail`
- `AdminTopup`
- `Flow` 及四类业务流详情
- `Redemption` / `RedemptionDetail` / `EditRedemption`
- `User` / `UserDetail` / `AddUser`

这些页面的核心对象是平台资源或运营对象，不应该复用到用户工作区。

### 明确属于用户工作区

- `WorkspaceStart`
- `Chat`
- `Dashboard`
- `ServicePricing`
- `HelpDoc`
- `TopUp`
- `TopUpOrderDetail`
- `Token` / `EditToken`

这些页面的核心对象是当前登录用户的消费与自助操作，不应该混入管理态诊断信息。

### 混杂待拆分

#### 1. `Setting`

入口页面是同一个 [web/src/pages/Setting/index.jsx](/Users/liuxin2/Workspace/opensource/router/web/src/pages/Setting/index.jsx:1)，通过 `location.pathname.startsWith('/admin/')` 区分：

- 管理态：系统设置、运营配置、汇率、币种、运行时
- 用户态：`PersonalSetting`

结论：

- 当前路由可用
- 组件语义是混杂的
- 建议后续拆成：
  - `AdminSettingPage`
  - `WorkspaceAccountPage`

#### 2. `Task`

列表页和详情页都复用同一组件：

- [web/src/pages/Task/index.jsx](/Users/liuxin2/Workspace/opensource/router/web/src/pages/Task/index.jsx:20)
- [web/src/pages/Task/Detail.jsx](/Users/liuxin2/Workspace/opensource/router/web/src/pages/Task/Detail.jsx:14)

当前实际承载了三种语境：

- `/admin/channel/tasks`：系统任务，偏渠道测试/刷新
- `/admin/task`：管理员查看用户任务
- `/workspace/task`：普通用户查看个人任务

结论：

- 这是当前最典型的混杂页
- 数据源、过滤项、可执行动作、返回导航都在分支
- 应优先拆成三个明确入口：
  - `AdminChannelTaskPage`
  - `AdminUserTaskPage`
  - `WorkspaceTaskPage`

#### 3. `Log`

列表页和详情页也在复用：

- [web/src/components/LogsTable.jsx](/Users/liuxin2/Workspace/opensource/router/web/src/components/LogsTable.jsx:1)
- [web/src/pages/Log/Detail.jsx](/Users/liuxin2/Workspace/opensource/router/web/src/pages/Log/Detail.jsx:1)

当前根据路径判断管理 / 用户语境：

- `/admin/log`
- `/workspace/log`

问题不在数据源切换本身，而在展示语义：

- 管理态日志会跳转到渠道、分组、用户排障
- 用户态日志应该只强调自己的调用结果、费用和时间线

结论：

- 可以保留底层表格能力复用
- 但页面容器和告警文案应拆成管理态 / 用户态

## 告警归属规则

### 只应出现在管理工作区的告警

- 渠道熔断
- 上游超时 / 测试失败 / 模型不兼容
- 计费快照刷新失败
- 渠道刷新任务失败
- 端点策略异常
- 汇率同步失败
- 供应商/渠道配置缺失

这类告警的特征是：需要平台侧处理，不是普通用户能解决的问题。

### 只应出现在用户工作区的告警

- 余额不足
- 套餐已过期 / 即将失效
- 充值未完成
- 令牌已禁用 / 已过期
- 个人任务失败
- 调用额度不足

这类告警的特征是：只影响当前用户，并且下一步动作是充值、续费、修改个人配置或重试。

### 需要双侧存在，但内容必须分开的告警

- 服务暂时不可用
- 某项任务失败
- 调用失败

处理方式：

- 管理工作区展示原因和作用域
- 用户工作区只展示影响和建议动作

示例：

- 管理态：`gpt-image-2 测试失败，原因是上游经 Cloudflare 返回 524`
- 用户态：`当前图片服务暂不可用，请稍后重试`

## 第一批拆分优先级

### P0：先拆语义，不先改样式

1. `Task`
2. `Setting`
3. `Log`

原因：

- 这三处已经通过路径前缀在一个组件里承载多种语境
- 后续告警体系如果不先拆这里，页面会持续混杂

### P1：再整理管理态告警块

优先检查：

1. 渠道详情页
2. 渠道测试历史
3. 渠道计费页
4. 管理任务详情

这些页面应统一支持：

- 页面级告警：影响整个对象
- 区块级告警：影响当前 section
- 行级告警：影响单行资源

### P2：最后收敛用户态告警块

优先检查：

1. 用户余额页
2. 套餐页
3. 充值记录页
4. 令牌页
5. 用户任务页

目标：

- 只留下用户能理解、也能行动的告警
- 不直接暴露平台内部诊断细节

## 建议的后续实施方式

### 第一步：先拆页面容器

不要先拆底层表格或表单组件，先拆页面入口：

- 不同工作区有不同容器
- 不同容器再决定告警区、面包屑、标题、动作按钮

### 第二步：给告警建统一数据模型

建议统一字段：

- `workspace`: `admin | user`
- `severity`: `info | warning | error`
- `scope`: `page | section | row | field`
- `summary`
- `detail`
- `action`

### 第三步：允许底层能力复用，但不复用页面语义

可以复用：

- 表格列定义工具函数
- 数据格式化函数
- 查询过滤控件
- API 访问层

不要继续复用：

- 同一个页面组件通过 `pathname` 承担不同工作区语义
- 同一份告警文案同时喂给管理员和普通用户

## 本次结论

当前仓库已经有明确的管理路由和用户路由，但页面层仍有三块混杂区域：

1. `Setting`
2. `Task`
3. `Log`

后续工作的起点应该是：

- 先拆这三类页面容器
- 再把告警单独拎出来
- 最后再做视觉和布局收敛

这比直接改样式更稳，也更容易判断告警到底该出现在谁面前。
