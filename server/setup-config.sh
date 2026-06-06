#!/bin/bash
# config.yaml インタラクティブセットアップ
# 使い方: bash setup-config.sh

set -e

CONFIG_FILE="./config.yaml"

echo "=== HideMe サーバー設定 ==="
echo ""

# config.yaml が既に存在する場合は スキップ
if [ -f "$CONFIG_FILE" ]; then
  echo "✓ config.yaml が既に存在します"
  exit 0
fi

echo "設定を入力してください（ Enter でデフォルト値）"
echo ""

# 公開 URL
read -p "公開 URL (デフォルト: http://localhost:8080): " PUBLIC_URL
PUBLIC_URL=${PUBLIC_URL:-"http://localhost:8080"}

# ストレージタイプ
echo ""
echo "ストレージタイプを選択:"
echo "  1) local（ローカル保存）"
echo "  2) nas（NAS 保存）"
read -p "選択 (1 or 2, デフォルト: 1): " STORAGE_TYPE
STORAGE_TYPE=${STORAGE_TYPE:-"1"}

STORAGE_TYPE_NAME="local"
if [ "$STORAGE_TYPE" = "2" ]; then
  STORAGE_TYPE_NAME="nas"
  read -p "NAS ホスト: " NAS_HOST
  read -p "NAS ユーザー: " NAS_USER
  read -sp "NAS パスワード: " NAS_PASS
  echo ""
  read -p "NAS 共有フォルダ (例: HideMe/uploads): " NAS_SHARE
fi

# Discord 設定
echo ""
echo "Discord OAuth2 設定:"
read -p "Client ID (空欄でスキップ): " DISCORD_CLIENT_ID
read -sp "Client Secret (空欄でスキップ): " DISCORD_CLIENT_SECRET
echo ""

# ポート
echo ""
read -p "サーバーポート (デフォルト: 8080): " SERVER_PORT
SERVER_PORT=${SERVER_PORT:-"8080"}

# config.yaml 生成
cat > "$CONFIG_FILE" << EOF
# HideMe サーバー設定

server:
  port: $SERVER_PORT
  host: "0.0.0.0"

public:
  url: "$PUBLIC_URL"

database:
  path: "./hideme.db"

storage:
  type: "$STORAGE_TYPE_NAME"
  local:
    base_dir: "./uploads"
  nas:
    host: "${NAS_HOST:-192.168.1.100}"
    user: "${NAS_USER:-admin}"
    password: "${NAS_PASS:-password}"
    share: "${NAS_SHARE:-HideMe/uploads}"
    port: 445

discord:
  client_id: "$DISCORD_CLIENT_ID"
  client_secret: "$DISCORD_CLIENT_SECRET"
  guild_id: ""
  required_role: ""

ffmpeg:
  path: "ffmpeg"

logging:
  level: "info"
  format: "json"
EOF

echo ""
echo "✓ config.yaml を作成しました"
echo ""
echo "設定内容:"
echo "  公開 URL: $PUBLIC_URL"
echo "  ストレージ: $STORAGE_TYPE_NAME"
echo "  ポート: $SERVER_PORT"
echo ""
echo "さらに設定を変更する場合: vim config.yaml"
