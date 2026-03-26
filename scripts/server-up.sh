#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "[错误] 请先在项目根目录创建 .env（可执行: cp .env.example .env）"
  echo "       部署到服务器时务必修改：JWT_SECRET、各类密码、VITE_API_URL（填公网可访问的后端地址）"
  exit 1
fi

echo "[提示] 启动 MySQL + MinIO + 后端 + 前端（后台运行）…"
docker compose up -d --build

echo
docker compose ps
echo
echo "前端:    http://<服务器IP>:${FRONTEND_PORT:-28080} （以 .env 中 FRONTEND_PORT 为准）"
echo "API:     http://<服务器IP>:${BACKEND_PORT:-23000}"
echo "MinIO:   API ${MINIO_PUBLISH_API_PORT:-29000} / 控制台 ${MINIO_PUBLISH_CONSOLE_PORT:-29001}"
echo "数据迁移说明见 deploy/README.md"
