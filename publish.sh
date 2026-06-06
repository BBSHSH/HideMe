#!/bin/bash
# HideMe ワンコマンド公開スクリプト
# 使い方: bash publish.sh

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "=== HideMe ワンコマンド公開 ==="
echo ""

# ffmpeg 確認
if ! command -v ffmpeg &> /dev/null; then
  echo "❌ ffmpeg がインストールされていません"
  echo "実行: sudo bash setup-linux.sh"
  exit 1
fi
echo "✓ ffmpeg: $(ffmpeg -version | head -1)"

# ビルド
echo ""
echo "[1/4] ビルド中..."
./deploy.sh > /dev/null 2>&1
echo "✓ ビルド完了"

# cloudflared 確認
echo ""
echo "[2/4] cloudflared 確認..."
if ! command -v cloudflared &> /dev/null; then
  echo "cloudflared をインストール中..."
  curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
fi
echo "✓ cloudflared: $(cloudflared --version)"

# Cloudflare ログイン確認
echo ""
echo "[3/4] Cloudflare 認証確認..."
if [ ! -d ~/.cloudflared ]; then
  echo "ブラウザが開きます。Cloudflare にログインしてください..."
  cloudflared tunnel login
fi
echo "✓ 認証済み"

# トンネル作成・起動
echo ""
echo "[4/4] トンネル起動..."
TUNNEL_NAME="hideme"
TUNNEL_ID=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | awk '{print $1}' || echo "")

if [ -z "$TUNNEL_ID" ]; then
  echo "トンネルを作成中..."
  cloudflared tunnel create "$TUNNEL_NAME"
  TUNNEL_ID=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | awk '{print $1}')
fi

echo "✓ トンネル ID: $TUNNEL_ID"

# config.yml 作成
cat > ~/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: ~/.cloudflared/${TUNNEL_ID}.json

ingress:
  - service: http://localhost:8080
EOF

echo ""
echo "=== 🎉 セットアップ完了 ==="
echo ""
echo "起動コマンド:"
echo "  cd $ROOT/server"
echo "  ./hideme &"
echo ""
echo "別のターミナルで:"
echo "  cloudflared tunnel run hideme"
echo ""
echo "または systemd で自動起動:"
echo "  sudo systemctl start hideme cloudflared"
echo ""
echo "ログ確認:"
echo "  sudo journalctl -u hideme -f"
echo ""
echo "DNS 設定:"
echo "  cloudflared tunnel route dns hideme <your-domain>"
echo ""
