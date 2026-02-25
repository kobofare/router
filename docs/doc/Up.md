# Router 本次启动与公网接入全记录（指挥官视角）

我以“部署总指挥 + 教练”的方式整理这份文档：你能一键复制执行，也能理解背后的原理与风险点。目标只有三条：
- 不影响同机其他服务
- 强制连接同一套 PostgreSQL（禁止 SQLite）
- 公网 `https://router.yeying.pub/` 可访问

---

**Overview**

本次实际落地结果（与现状一致）：
- REPO_ROOT：`/root/code/router`
- `.env`：写入 `SQL_DSN=postgres://...`
- 本地端口：`13011`
- systemd：`/etc/systemd/system/router.service`
- Nginx：`/etc/nginx/conf.d/router.conf` 反代到 `127.0.0.1:13011`
- 验证：日志出现 `openPostgreSQL` + `/api/status` 返回 `success:true`

---

**Mermaid**

```mermaid
flowchart LR
    User[Client / Browser] -->|HTTPS 443| Nginx[Nginx: router.yeying.pub]
    Nginx -->|proxy_pass 127.0.0.1:13011| Router[Router Service]
    Router -->|SQL_DSN| PG[(PostgreSQL @ 51.75.133.235:5432)]

    subgraph Host[Server Host]
        Nginx
        Router
    end
```

---

**Commands**

这一段是“可直接复制粘贴执行”的最小操作链。你照做就能起，且不会踩到 SQLite。

```bash
# 0) 进入项目根目录
cd /root/code/router

# 1) 写入 .env（密码请替换为真实值）
cat > .env <<'EOF_ENV'
SQL_DSN=postgres://router:***@51.75.133.235:5432/router?sslmode=disable
EOF_ENV
chmod 600 .env

# 2) 安装 PG 客户端，用于验证 DSN
apt-get update && apt-get install -y postgresql-client

# 3) 验证 DSN 可连通（必须看到返回行）
set -a; source .env; set +a
psql "$SQL_DSN" -Atqc "select current_user, current_database(), inet_server_port();"

# 4) 构建前端（仓库无 package-lock，因此用 npm install）
npm install --prefix web
npm run build --prefix web

# 5) 构建后端
mkdir -p build
GOFLAGS="" go build -o build/router ./cmd/router

# 6) systemd 服务（本次采用 13011，避免端口冲突）
cat > /etc/systemd/system/router.service <<'EOF_SERVICE'
[Unit]
Description=Router Local Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/code/router
ExecStart=/root/code/router/build/router --port 13011 --log-dir ./logs
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF_SERVICE

systemctl daemon-reload
systemctl restart router
systemctl status router --no-pager

# 7) 若修改了 Nginx 配置，执行 reload
nginx -t && systemctl reload nginx
```

---

**Why**

关键决策解释（理解原则，才不会踩坑）：
- `WorkingDirectory=/root/code/router`：这是 .env 自动加载的关键点，目录不对就会回落 SQLite。
- 端口 `13011`：避开 80/443/3011 等公共服务端口，最大化不干扰其他服务。
- 先 `psql`：提前确认 DSN 可连通，比起服后再排错更安全、更快。
- systemd：确保进程被守护并可用 `journalctl -u router` 统一查看日志。

---

**Build**

理解这两个关键点，构建就不会出错：
- 前端构建产物是 `web/dist`，Go 通过 `embed` 打包，如果没有 `web/dist` 会直接编译失败。
- 本仓库没有 `package-lock.json`，所以 `npm ci` 会报错，必须用 `npm install`。

---

**Service**

systemd 关键字段说明：
- `WorkingDirectory=/root/code/router`：保证 `.env` 自动加载
- `ExecStart=/root/code/router/build/router --port 13011 --log-dir ./logs`：明确端口与日志位置
- `Restart=on-failure`：异常退出自动拉起

查看当前服务配置与状态：
```bash
cat /etc/systemd/system/router.service
systemctl status router --no-pager
```

---

**Nginx**

公网能否访问，取决于 Nginx 是否正确反代到服务端口。当前有效配置片段如下：

```nginx
location / {
    proxy_pass http://127.0.0.1:13011;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_request_buffering off;
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

修改完成后执行：
```bash
nginx -t && systemctl reload nginx
```

---

**Verify**

只认这两条硬验证：

```bash
# 1) DB 类型必须是 PostgreSQL
journalctl -u router --since 'today' --no-pager | rg "openPostgreSQL|openSQLite|openMySQL" -S

# 2) 健康检查必须 success:true
curl -s http://127.0.0.1:13011/api/status
```

建议补充检查：
```bash
# 端口监听
ss -lntp | rg ":13011"

# 公网可达性
curl -I https://router.yeying.pub
```

---

**Troubleshoot**

出现 `openSQLite` 或 `root/123456` 痕迹，立即停下并回查：
- `.env` 是否在 `WorkingDirectory` 下
- `router.service` 的 `WorkingDirectory` 是否写错
- `SQL_DSN` 是否遗漏或拼错

出现 502 或公网不可达：
- `router.service` 的端口与 `router.conf` 的 `proxy_pass` 是否一致
- `ss -lntp` 是否有监听
- `nginx -t` 是否通过

出现 `embed.go: ... web/dist` 报错：
- 先执行 `npm run build --prefix web`，再重新 `go build`

---

**Safety**

安全纪律（请严格执行）：
- `.env` 禁止提交 Git，权限保持 `600`
- 文档与截图不要泄漏明文密码
- 任何端口调整必须同时修改 Router 与 Nginx

---

**Quick Recall**

三条记忆法：
1. `WorkingDirectory` 对了 `.env` 才会生效
2. Nginx 端口必须与 Router 端口一致
3. 日志出现 `openPostgreSQL` 才算合格
