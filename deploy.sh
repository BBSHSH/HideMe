#!/bin/bash
# HideMe デプロイスクリプト (Linux)
# 使い方: ./deploy.sh
# 必須: Node.js, Go, ffmpeg

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

# ffmpeg 確認・インストール
if ! command -v ffmpeg &> /dev/null; then
  echo "== ffmpeg がインストールされていません =="
  echo "Debian/Ubuntu: sudo apt-get install -y ffmpeg"
  echo "RHEL/CentOS:   sudo yum install -y ffmpeg"
  echo "Alpine:        sudo apk add ffmpeg"
  exit 1
fi
echo "✓ ffmpeg: $(ffmpeg -version | head -1)"

echo "== [1/3] フロントエンド ビルド =="
cd "$ROOT/client"
npm run build

echo "== [2/3] dist を server へコピー =="
rm -rf "$ROOT/server/dist"
cp -r "$ROOT/client/dist" "$ROOT/server/dist"
echo "  client/dist -> server/dist"

echo "== [3/3] サーバー ビルド =="
cd "$ROOT/server"
go build -o hideme ./cmd/api

echo ""
echo "== デプロイ完了 =="
echo "起動: cd server && ./hideme"
echo "ポート: 8080 (PORT 環境変数で変更可)"
