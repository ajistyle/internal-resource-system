#!/usr/bin/env bash
# 在本机（有数据的 MySQL 所在机器）执行，导出业务库 SQL。
# 用法：在仓库根目录执行，或先 export 变量再运行。
#
#   cp .env.example .env.local-mysql   # 按需填写下面几个变量后：
#   export $(grep -v '^#' .env.local-mysql | xargs)   # 谨慎：仅适用于无特殊字符的 .env
#   ./scripts/mysql-dump-local.sh ./backup.sql
#
# 更简单：直接改脚本里的默认值，或命令行临时指定：
#   MYSQL_HOST=127.0.0.1 MYSQL_PORT=3307 MYSQL_ROOT_PASSWORD=你的密码 \
#   DB_DATABASE=internal_resource_db ./scripts/mysql-dump-local.sh backup.sql

set -euo pipefail
OUT=${1:-./internal_resource_db_backup_$(date +%Y%m%d_%H%M%S).sql}

MYSQL_HOST=${MYSQL_HOST:-127.0.0.1}
MYSQL_PORT=${MYSQL_PORT:-3307}
DB_DATABASE=${DB_DATABASE:-internal_resource_db}

if [[ -z "${MYSQL_ROOT_PASSWORD:-}" ]]; then
  echo "请设置环境变量 MYSQL_ROOT_PASSWORD（本机 MySQL root 密码）"
  exit 1
fi

echo "导出 $DB_DATABASE @ $MYSQL_HOST:$MYSQL_PORT -> $OUT"
MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump \
  -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u root \
  --single-transaction --routines --triggers \
  --databases "$DB_DATABASE" \
  > "$OUT"

echo "完成: $OUT （请将文件安全拷贝到服务器后执行 scripts/mysql-restore-docker.sh）"
