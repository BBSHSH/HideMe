#!/bin/bash
# Linux 初期セットアップスクリプト
# 使い方: sudo bash setup-linux.sh

set -e

echo "=== HideMe Linux セットアップ ==="

# OS 判定
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$NAME
else
  echo "Error: Cannot detect OS"
  exit 1
fi

echo "Detected: $OS"

# パッケージ管理マネージャーで ffmpeg インストール
if command -v apt-get &> /dev/null; then
  echo "Installing with apt-get..."
  apt-get update
  apt-get install -y git curl wget ffmpeg
elif command -v yum &> /dev/null; then
  echo "Installing with yum..."
  yum install -y git curl wget ffmpeg
elif command -v apk &> /dev/null; then
  echo "Installing with apk..."
  apk add --no-cache git curl wget ffmpeg
else
  echo "Unsupported package manager. Please install ffmpeg manually."
  exit 1
fi

# ユーザー作成
echo "Creating hideme user..."
if ! id hideme &> /dev/null; then
  useradd -m -s /bin/bash hideme
  echo "User 'hideme' created"
else
  echo "User 'hideme' already exists"
fi

# ディレクトリ作成
mkdir -p /var/lib/hideme
chown hideme:hideme /var/lib/hideme

# systemd サービスコピー
echo "Installing systemd service..."
cp hideme.service /etc/systemd/system/
systemctl daemon-reload

echo ""
echo "=== セットアップ完了 ==="
echo ""
echo "次のステップ:"
echo "  1. プロジェクトをクローン: git clone <url>"
echo "  2. ビルド: ./deploy.sh"
echo "  3. サービス開始: sudo systemctl start hideme"
echo "  4. ステータス確認: sudo systemctl status hideme"
echo "  5. ログ確認: sudo journalctl -u hideme -f"
echo ""
