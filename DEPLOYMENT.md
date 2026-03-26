# 部署手册（internal-resource-system）

本文档基于当前项目代码现状（前端 Vite + React + Ant Design，后端 NestJS + TypeORM + MySQL）整理。

## 1. 系统架构

- **前端**：Vite + React + TypeScript + Ant Design  
  - 通过 `VITE_API_URL`（如不配置默认 `http://localhost:3000`）访问后端 API
- **后端**：NestJS + TypeORM + MySQL  
  - JWT 鉴权（`Authorization: Bearer <token>`）
- **数据库**：MySQL（默认库名 `internal_resource_db`）

## 2. 环境要求

- Node.js：建议 18+（可用 20+）
- MySQL：8.0+（5.7 也通常可用）
- 端口：
  - 后端默认：`3000`
  - 前端开发：`5173`（Vite 默认）

## 3. 数据库准备

### 3.1 创建数据库

在 MySQL 执行：

```sql
CREATE DATABASE IF NOT EXISTS internal_resource_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

### 3.2 表结构同步方式（当前后端）

后端 `TypeORM` 当前配置为：

- `synchronize: true`

含义：后端启动时会根据实体 **自动创建/更新表结构**（适合开发/测试）。生产建议后续改为迁移（migrations）模式。

## 4. 后端部署

### 4.1 配置环境变量

后端读取 `.env`（或系统环境变量），关键变量：

- `DB_HOST`：数据库地址（默认 `localhost`）
- `DB_PORT`：数据库端口（默认 `3307`）
- `DB_USERNAME`：用户名（默认 `root`）
- `DB_PASSWORD`：密码（默认 `123456`）
- `DB_DATABASE`：库名（默认 `internal_resource_db`）
- `JWT_SECRET`：JWT 密钥（务必改成强随机串）

建议在 `backend/.env` 配置，例如：

```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=internal_resource_db
JWT_SECRET=change_me_in_prod
```

### 4.2 安装依赖与启动

```bash
cd backend
npm install

# 开发（含热更新）
npm run start:dev

# 生产构建
npm run build
npm run start:prod
```

## 5. 前端部署

### 5.1 配置 API 地址（推荐）

在 `frontend/.env.production`（或部署环境变量）设置：

```ini
VITE_API_URL=https://your-api.example.com
```

### 5.2 安装依赖与构建

```bash
cd frontend
npm install

# 开发
npm run dev

# 生产构建
npm run build
```

构建产物在 `frontend/dist`，可用 Nginx/静态服务器部署。

## 6. 反向代理（Nginx 示例）

前端静态站点 + 后端 API 分域或同域均可。一个常见同域方式：

```nginx
server {
  listen 80;
  server_name your.example.com;

  # 前端静态文件
  root /var/www/internal-resource-system/frontend/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # 后端 API
  location /api/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

> 若采用 `/api` 前缀，需要前端把 `VITE_API_URL` 改为 `https://your.example.com/api`，或后端统一加全局前缀。

## 7. 账号与权限

- 登录后获得 JWT token，前端会缓存到 `localStorage`
- 常见角色：
  - `ADMIN`：管理员（用户管理等）
  - `EDITOR`：可编辑大多数业务数据

