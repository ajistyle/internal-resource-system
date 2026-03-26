#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "[minio] 未找到 .env，已从 .env.example 复制；请编辑 .env 修改 MINIO_ROOT_PASSWORD"
  cp .env.example .env
fi

docker compose up -d

echo ""
echo "[minio] 已启动"
echo "  - S3 API:   http://127.0.0.1:${MINIO_PUBLISH_API_PORT:-9000}"
echo "  - 控制台:   http://127.0.0.1:${MINIO_PUBLISH_CONSOLE_PORT:-9001}"
echo ""
echo "  后端请配置（与 .env 中账号一致）："
echo "  MINIO_ENDPOINT=127.0.0.1  （或 host.docker.internal，视后端运行位置而定）"
echo "  MINIO_PORT=9000"
echo "  MINIO_USE_SSL=false"
echo "  MINIO_ACCESS_KEY=<MINIO_ROOT_USER>"
echo "  MINIO_SECRET_KEY=<MINIO_ROOT_PASSWORD>"
echo "  MINIO_BUCKET=project-attachments"
echo ""
echo "  停止: docker compose -f \"$ROOT/docker-compose.yml\" down"
