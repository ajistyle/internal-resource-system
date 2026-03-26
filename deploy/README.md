# 服务器一键部署与数据迁移

**完整部署步骤（拷什么、配什么、如何更新）见同级文档 [`DEPLOYMENT.md`](./DEPLOYMENT.md)。**  
MySQL / MinIO 数据默认落在**项目根目录** `data/mysql`、`data/minio`，与程序同文件夹管理。

## 一、架构说明

根目录 `docker-compose.yml` 会启动：

| 服务 | 说明 |
|------|------|
| `mysql` | 业务库（默认库名见 `.env` 中 `DB_DATABASE`） |
| `minio` | 项目附件（S3 兼容），后端通过容器名 `minio:9000` 访问 |
| `backend` | NestJS API |
| `frontend` | 前端静态资源 + Nginx |

默认**对外端口**以 `.env.example` 为准（可避免与本机开发端口冲突），部署到服务器后务必在 **`.env`** 中修改密码与 `VITE_API_URL`。

## 二、服务器上准备

1. 安装 **Docker** 与 **Docker Compose v2**。
2. 将本仓库拷到服务器（或 `git clone`）。
3. 配置环境变量：

```bash
cd /path/to/internal-resource-system
cp .env.example .env
```

编辑 `.env`，**至少**修改：

- `JWT_SECRET`：生产环境强随机字符串  
- `MYSQL_ROOT_PASSWORD`：数据库 root 密码  
- `MINIO_ROOT_PASSWORD` / `MINIO_SECRET_KEY`：**保持一致**（并与 `MINIO_ACCESS_KEY` / `MINIO_ROOT_USER` 的对应关系见 `.env.example`）  
- **`VITE_API_URL`**：浏览器能访问到的后端地址，例如：  
  - `http://你的服务器公网IP:23000`  
  - 若前面有反向代理：`https://api.你的域名`

保存后，**前端镜像会按 `VITE_API_URL` 在构建时打入静态资源**，改此项后需要重新构建前端：

```bash
docker compose build --no-cache frontend && docker compose up -d
```

## 三、一键启动

在项目根目录：

```bash
bash scripts/server-up.sh
```

或直接：

```bash
docker compose up -d --build
```

访问（端口以 `.env` 为准）：

- 前端：`http://<服务器IP>:<FRONTEND_PORT>`
- API：`http://<服务器IP>:<BACKEND_PORT>`
- MinIO API：`http://<服务器IP>:<MINIO_PUBLISH_API_PORT>`
- MinIO 控制台：`http://<服务器IP>:<MINIO_PUBLISH_CONSOLE_PORT>`

## 四、把本机 MySQL 数据拷到服务器

### 4.1 在本机导出

确认本机 MySQL 的地址、端口、root 密码、库名（例如开发时常为 `127.0.0.1:3307`、`internal_resource_db`）。

在**本机**项目根目录执行（先设置密码）：

```bash
export MYSQL_HOST=127.0.0.1
export MYSQL_PORT=3307
export MYSQL_ROOT_PASSWORD=你的本机root密码
export DB_DATABASE=internal_resource_db

bash scripts/mysql-dump-local.sh ./internal_resource_backup.sql
```

脚本使用 `mysqldump --databases`，生成的 SQL **包含建库语句**，适合在新环境整库恢复。

### 4.2 把文件拷到服务器

例如：

```bash
scp ./internal_resource_backup.sql user@你的服务器:/path/to/internal-resource-system/
```

### 4.3 在服务器导入

**顺序建议**：先 `docker compose up -d` 让 MySQL 容器跑起来（首次会创建数据目录），再导入覆盖数据；或在新机器空数据时也可先起栈再导入。

在**服务器**项目根目录：

```bash
bash scripts/mysql-restore-docker.sh ./internal_resource_backup.sql
```

导入脚本会把 SQL 拷进 `mysql` 容器并执行；使用的是容器里已为 root 配置的 `MYSQL_ROOT_PASSWORD`（与当前 `.env` / compose 一致即可）。

若 dump 很大，注意磁盘空间与导入时间。

## 五、MinIO 里的附件（可选）

数据库里只存对象路径；**文件二进制**在 MinIO 的 `data` 卷中。

若本机也在用 MinIO 且需要保留附件：

1. **推荐**：在本机安装 [MinIO Client `mc`](https://min.io/docs/minio/linux/reference/minio-mc.html)，配置本地与服务器两个 alias，对 bucket（默认常为 `project-attachments`）执行 `mc mirror` 同步。  
2. 或把本机 MinIO 数据卷目录打包拷到服务器对应 volume（难度较高，需版本一致、停机拷贝）。

服务器上 MinIO 的 `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` 须与 `.env` 里传给后端的 `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` **一致**，否则后端无法访问存储。

## 六、附件下载与公网（进阶）

后端生成预签名 URL 时依赖 MinIO 的 endpoint 配置。若浏览器无法下载附件，通常需要把 MinIO 配成对浏览器可达的地址（例如反代或单独配置对外域名），必要时再单独调整应用侧配置。一般部署可先以「数据库 + 基本功能」为主，附件再按需排查。

## 七、旧版「仅 MinIO 单独目录」

历史脚本仍在 `docker/minio/`；**现在推荐只用根目录 `docker-compose.yml`**，已包含 MinIO，避免重复启动与端口混乱。
