# 内网资源系统 — 服务器部署手册

本文约定：你在服务器上**自建一个目录**（例如 `/opt/internal-resource-system`），**程序代码与 MySQL、MinIO 的持久化数据**都放在该目录下，便于打包备份与迁移。

> 技术栈：`docker-compose` 一键启动 **MySQL + MinIO + 后端（NestJS）+ 前端（Nginx 静态站点）**。  
> 数据路径：项目根目录下的 `data/mysql`、`data/minio`（由 Compose 挂载，**不要删**，除非你要清空数据）。

---

## 一、需要拷贝到服务器的内容

### 1.1 推荐方式（优先）：在服务器上用 Git

在服务器创建目录并克隆（**无需**把本机 `node_modules` 拷过去，镜像构建时在容器内安装依赖）：

```bash
sudo mkdir -p /opt/internal-resource-system
sudo chown -R "$USER":"$USER" /opt/internal-resource-system
cd /opt/internal-resource-system
git clone <你的仓库地址> .
```

若没有 Git，见下一节「整目录拷贝」。

### 1.2 备选：从本机打包拷贝整个项目目录

在本机项目根目录打包时，**建议排除**体积大且可再生的目录（不拷也能部署，Docker 构建会重装依赖）：

可排除（可选）：

- `frontend/node_modules`
- `backend/node_modules`
- `frontend/dist`
- `backend/dist`
- `.git`（若你只用 zip 部署、不在服务器上 `git pull` 更新）

**必须包含**（缺一不可）：

| 路径 | 说明 |
|------|------|
| `backend/` | 后端源码（含 `package.json`、`package-lock.json`、`Dockerfile`、`src/`） |
| `frontend/` | 前端源码（含 `package.json`、`package-lock.json`、`Dockerfile`、`nginx.conf`、`src/` 等） |
| `docker-compose.yml` | 编排文件 |
| `.env.example` | 环境变量模板 |
| `scripts/` | 一键启动、导入 SQL 等脚本（可选但推荐） |
| `deploy/` | 说明文档 |

**不要**把本机开发用的 `data/` 整个随便覆盖到服务器（若本机也有 Docker 数据，请先确认路径与权限）；**首次部署**让服务器在启动时自动生成空的 `data/mysql`、`data/minio`，或使用全新空目录。

> 若你从本机复制了**已含数据的** `data/mysql` 或 `data/minio`，须保证与当前 MySQL/MinIO 大版本兼容，并建议停库后再拷贝（见后文备份说明）。

### 1.3 服务器上首次创建数据目录（可选）

Compose 首次启动时一般会自动创建挂载目录；也可手动建好并控制权限：

```bash
cd /opt/internal-resource-system   # 换成你的程序根目录
mkdir -p data/mysql data/minio
```

在 Linux 上若遇到 MySQL 容器写权限问题，可先尝试：

```bash
chmod -R 777 data   # 仅作排障；生产可按需收紧为 Docker 运行用户
```

---

## 二、拷贝完成后：配置与启动

### 2.1 环境要求

- 已安装 **Docker Engine** 与 **Docker Compose v2**（`docker compose version` 能执行）。
- 防火墙/安全组放行你在 `.env` 里为 **前端、API、MySQL（如需远程维护）、MinIO** 设置的端口。

### 2.2 生成并编辑 `.env`

程序根目录执行：

```bash
cd /opt/internal-resource-system
cp .env.example .env
nano .env   # 或用 vim / Code Server 等
```

**必须核对或修改**的项（说明摘自 `.env.example`，以实际文件为准）：

| 变量 | 作用 | 部署时注意 |
|------|------|------------|
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 | **改成强密码**；与 `DB_PASSWORD` 所用一致（compose 里后端连库用的 root） |
| `DB_DATABASE` | 业务库名 | 默认 `internal_resource_db`，一般不改 |
| `MYSQL_PORT` | 宿主机访问 MySQL 的端口 | 若对外开放，注意防火墙；仅本机维护可只绑 `127.0.0.1`（需改 compose 时另说） |
| `JWT_SECRET` | JWT 签发密钥 | **生产必改**为长随机串 |
| `BACKEND_PORT` | 浏览器/API 对外端口 | 与安全组一致 |
| `FRONTEND_PORT` | 浏览器访问前端 | 与安全组一致 |
| **`VITE_API_URL`** | 前端页面请求的后端基地址 | **必须是用户浏览器能访问到的 URL**<br>例：`http://你的公网IP:23000` 或 `https://api.你的域名`<br>错填会导致登录后接口全失败 |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | MinIO 控制台与根账号 | 修改默认密码 |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | 后端连 MinIO | **须与** `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` **一致**（与 `.env.example` 说明一致） |
| `MINIO_PUBLISH_API_PORT` / `MINIO_PUBLISH_CONSOLE_PORT` | MinIO 对外端口 | 按需改，避免端口冲突 |

**重要：** 修改 `VITE_API_URL` 或前端相关构建参数后，必须**重新构建前端镜像**（见第三节「更新」）。

### 2.3 首次启动

在**程序根目录**（与 `docker-compose.yml` 同级）：

```bash
docker compose up -d --build
```

或使用脚本（会检查是否已有 `.env`）：

```bash
bash scripts/server-up.sh
```

首次启动 MySQL 会初始化 `data/mysql`，MinIO 会写 `data/minio`，可能需要 **1～3 分钟**。

查看状态：

```bash
docker compose ps
docker compose logs -f --tail=100 backend
```

### 2.4 访问地址（默认占位）

以 `.env.example` 默认端口为例（**以你 `.env` 为准**）：

- 前端：`http://<服务器IP>:28080`
- 后端 API：`http://<服务器IP>:23000`
- MinIO S3 API：`http://<服务器IP>:29000`
- MinIO 控制台：`http://<服务器IP>:29001`

### 2.5 从旧环境迁入 MySQL 数据（可选）

若你本机或其它环境已有业务库，在**本机**导出 SQL 后拷到服务器，在程序根目录执行：

```bash
bash scripts/mysql-restore-docker.sh /path/to/backup.sql
```

导出示例见 `scripts/mysql-dump-local.sh` 与 `deploy/README.md` 第四节。

---

## 三、数据与配置实际落盘位置（统一管理）

在服务器上，以程序根目录为 **`/opt/internal-resource-system`** 为例：

```
/opt/internal-resource-system/
├── docker-compose.yml
├── .env                 # 机密，勿泄露；建议备份
├── backend/
├── frontend/
├── scripts/
├── deploy/
└── data/                # 持久化数据（务必备份）
    ├── mysql/           # MySQL 数据文件
    └── minio/           # MinIO 对象存储
```

**备份建议：** 定期打包备份 **`data/` 整个目录** 与 **`.env`**；恢复时停栈 → 还原 `data/` 与 `.env` → 再启动（注意 MySQL 版本兼容）。

---

## 四、后续代码更新如何操作

在**服务器程序根目录**执行（**Git 方式**）：

```bash
cd /opt/internal-resource-system
git pull
```

然后**重新构建并拉起容器**（会用到新代码）：

```bash
docker compose up -d --build
```

### 4.1 仅后端或依赖变更

通常上面一条即可。若怀疑缓存导致问题：

```bash
docker compose build --no-cache backend
docker compose up -d backend
```

### 4.2 前端/环境变量涉及 `VITE_API_URL` 等构建期变量

改 `.env` 里 `VITE_API_URL` 等后，须**无缓存重建前端**再启动：

```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

### 4.3 数据库结构由 TypeORM `synchronize` 演进

当前项目开发模式依赖 TypeORM **自动同步表结构**；部署环境若 schema 有变，应确保新版本镜像已上线后再访问业务。重要环境建议后续改为 **迁移脚本**（可另做）。

### 4.4 清理旧镜像（可选）

释放磁盘：

```bash
docker image prune -f
```

### 4.5 非 Git 更新（zip 覆盖）

1. 停栈：`docker compose down`（**勿删 `data/`**）。  
2. 用新版本代码覆盖除 `data/`、`.env` 以外的目录。  
3. 再执行：`docker compose up -d --build`。

---

## 五、常见问题

| 现象 | 排查 |
|------|------|
| 前端能开但接口 404 / 连不上 | 检查 `VITE_API_URL` 是否为浏览器可访问的后端地址；改后需 `docker compose build --no-cache frontend && docker compose up -d` |
| 附件无法上传/下载 | 检查 `.env` 中 MinIO 变量与 MinIO 容器；预签名 URL 若需公网访问 MinIO，可能还需反代或调整对外地址（见 `deploy/README.md` 第六节） |
| MySQL 起不来 | 看 `docker compose logs mysql`；若 `data/mysql` 损坏，需从备份恢复或清空目录重做（**数据会丢**） |

---

## 六、文档索引

- 更简短的迁移说明：`deploy/README.md`
- 环境变量模板：仓库根目录 `.env.example`
