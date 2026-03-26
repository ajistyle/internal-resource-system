# Docker 部署手册（internal-resource-system）

目标：在一台新服务器上用 Docker 一键部署 **MySQL + 后端 + 前端**。

> 说明：前端是静态站点，`VITE_API_URL` 是**构建时写入**，不是运行时环境变量；如后端地址改变，需要重新构建前端镜像或改用反向代理同域方案。

## 1. 前置条件

- 已安装 Docker / Docker Compose（Docker Desktop 或 Linux 上的 `docker` + `docker compose`）
- 服务器开放端口（默认）：
  - 前端：8800
  - 后端：13000
  - MySQL：13307（可选，仅用于外部直连；生产环境建议不对外暴露）

## 2. 准备配置文件

### 2.1 需要拷贝到服务器的文件/目录

推荐直接拷贝整个项目目录 `internal-resource-system/`（最省事，便于在服务器上构建镜像），至少包含：

- `docker-compose.yml`
- `.env`（你创建的实际配置）
- `backend/`（含 `Dockerfile`、`package.json`、`src/` 等）
- `frontend/`（含 `Dockerfile`、`nginx.conf`、`package.json`、`src/` 等）

以及（可选）文档：

- `DEPLOYMENT_DOCKER.md`
- `.env.example`

### 2.2 创建 `.env`

在项目根目录（与 `docker-compose.yml` 同级）创建 `.env`（可从 `.env.example` 复制）：

```bash
cp .env.example .env
```

编辑 `.env`，至少修改：

- `MYSQL_ROOT_PASSWORD`：MySQL root 密码
- `JWT_SECRET`：JWT 密钥（务必改强随机串）
- `VITE_API_URL`：前端请求后端 API 的地址（必须是浏览器可访问地址）
  - 示例：`VITE_API_URL=http://192.168.2.220:13000`

如果你的服务器端口被占用（你当前情况），建议使用：

- `FRONTEND_PORT=8800`
- `BACKEND_PORT=13000`
- `MYSQL_PORT=13307`

## 3. 启动（首次）

在项目根目录执行：

```bash
docker compose up -d --build
```

查看状态：

```bash
docker compose ps
docker compose logs -f backend
```

## 4. 访问验证

- 访问前端：`http://192.168.2.220:8800/`
- 后端健康（可选）：`http://192.168.2.220:13000/`（默认返回 Hello World）

如果前端无法登录，重点检查：
- `.env` 中 `VITE_API_URL` 是否正确、是否能从浏览器访问到后端
- 后端容器日志是否报 DB 连接失败

## 5. 常用运维命令

### 5.1 停止/启动

```bash
docker compose stop
docker compose start
```

### 5.2 重启单个服务

```bash
docker compose restart backend
docker compose restart frontend
docker compose restart mysql
```

### 5.3 查看日志

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
```

### 5.4 更新部署（代码变更后）

```bash
docker compose up -d --build
```

> 若仅后端变更，可 `docker compose up -d --build backend`。

## 6. 数据持久化与备份

### 6.1 MySQL 数据卷

`docker-compose.yml` 已使用命名卷 `mysql_data` 持久化数据。

### 6.2 备份（示例）

```bash
docker exec -i irs-mysql mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" "$DB_DATABASE" > backup.sql
```

恢复：

```bash
cat backup.sql | docker exec -i irs-mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$DB_DATABASE"
```

## 7. 生产建议（重要）

- **不要对外暴露 MySQL 端口**：移除 `mysql` 的 `ports` 或仅绑定 `127.0.0.1:3307:3306`
- **固定 JWT_SECRET**：改为强随机串并妥善保管
- 后端目前 `TypeORM synchronize: true`：
  - 开发/测试方便
  - 生产建议后续改 migrations，避免意外结构变更
- 前端 `VITE_API_URL` 为构建时写入：
  - 若希望同域部署，建议用 Nginx 反代 `/api` 到后端，并将 `VITE_API_URL` 设为 `http(s)://<域名>/api`

## 8. 端口/配置一览（默认）

- 前端：`FRONTEND_PORT=8800`
- 后端：`BACKEND_PORT=13000`
- MySQL（可选）：`MYSQL_PORT=13307`

