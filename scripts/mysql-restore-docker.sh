#!/usr/bin/env bash
# 在「已运行 docker compose」的服务器项目根目录执行，把 SQL 导入 compose 内的 MySQL。
# 用法：./scripts/mysql-restore-docker.sh /path/to/backup.sql
#
# 推荐 dump 使用 scripts/mysql-dump-local.sh（含 --databases，可整库恢复）。
# 导入使用容器内环境变量 MYSQL_ROOT_PASSWORD（与 compose 配置一致）。

set -euo pipefail
cd "$(dirname "$0")/.."

SQL_FILE=${1:?用法: $0 /path/to/backup.sql}

if [[ ! -f "$SQL_FILE" ]]; then
  echo "找不到文件: $SQL_FILE"
  exit 1
fi

echo "拷贝 $SQL_FILE -> 容器 mysql:/tmp/restore.sql"
docker compose cp "$SQL_FILE" mysql:/tmp/restore.sql

echo "执行导入（使用 dump 内语句；若含 CREATE DATABASE 会一并执行）"
docker compose exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" < /tmp/restore.sql'

docker compose exec -T mysql rm -f /tmp/restore.sql
echo "导入完成。"
