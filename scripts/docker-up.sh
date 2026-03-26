#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]] && [[ -f .env.example ]]; then
  echo "[提示] 未找到 .env，将复制 .env.example 为 .env（可按需修改端口、密码、VITE_API_URL）"
  cp .env.example .env
fi

echo "[提示] 将启动 MySQL + MinIO + 后端 + 前端。后台运行请用：bash scripts/server-up.sh"
exec docker compose up --build "$@"
