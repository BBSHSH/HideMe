# HideMe Linux デプロイガイド

## 前提条件

- **Go**: 1.21 以上
- **Node.js**: 18 以上
- **ffmpeg**: 最新版
- **Git**: クローン用

## インストール手順

### 1. 依存パッケージのインストール

```bash
# Debian / Ubuntu
sudo apt-get update
sudo apt-get install -y git curl wget ffmpeg

# RHEL / CentOS / Rocky Linux
sudo yum install -y git curl wget ffmpeg

# Alpine Linux
sudo apk add --no-cache git curl wget ffmpeg
```

### 2. Go と Node.js のインストール（バージョン確認）

```bash
go version      # 1.21+ であること
node --version  # 18+ であること
npm --version   # 9+ であること
```

### 3. プロジェクトのクローン＆ビルド

```bash
cd ~
git clone https://github.com/your-repo/HideMe.git
cd HideMe
chmod +x deploy.sh
./deploy.sh
```

### 4. 起動

#### 方法① 直接起動（テスト用）

```bash
cd server
./hideme
```

#### 方法② systemd で自動起動（本番推奨）

```bash
# ユーザー作成
sudo useradd -m -s /bin/bash hideme
sudo cp HideMe /home/hideme/ -r
sudo chown -R hideme:hideme /home/hideme/HideMe

# サービスファイルをコピー
sudo cp hideme.service /etc/systemd/system/

# 起動
sudo systemctl enable hideme
sudo systemctl start hideme
sudo systemctl status hideme

# ログ確認
sudo journalctl -u hideme -f
```

#### 方法③ Docker で起動

```dockerfile
FROM golang:1.21-alpine AS builder
RUN apk add --no-cache git ffmpeg
WORKDIR /build
COPY . .
RUN cd server && go build -o hideme ./cmd/api

FROM alpine:latest
RUN apk add --no-cache ffmpeg
COPY --from=builder /build/server/hideme /app/hideme
COPY --from=builder /build/server/dist /app/dist
WORKDIR /app
ENV PORT=8080
CMD ["./hideme"]
```

## 環境変数設定

`hideme.service` または起動時に設定：

```bash
# ポート（デフォルト: 8080）
export PORT=8080

# ffmpeg パス（デフォルト: ffmpeg = PATH 検索）
export FFMPEG_PATH=/usr/bin/ffmpeg

# データベース（デフォルト: server/hideme.db）
export DB_PATH=/var/lib/hideme/hideme.db

# ストレージタイプ (local または nas)
export STORAGE_TYPE=local
# export STORAGE_TYPE=nas
# export STORAGE_NAS_ADDR=192.168.1.100
# export STORAGE_NAS_USER=admin
# export STORAGE_NAS_PASS=password
```

## Cloudflare Tunnel で公開（推奨）

```bash
# インストール
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# ログイン
cloudflared tunnel login

# トンネル作成
cloudflared tunnel create hideme

# トンネル開始
cloudflared tunnel run hideme
```

## トラブルシューティング

### ffmpeg not found
```bash
which ffmpeg  # パスを確認
export FFMPEG_PATH=$(which ffmpeg)
```

### ポートがすでに使用されている
```bash
lsof -i :8080
export PORT=8081
```

### アクセス権限エラー
```bash
# NAS の認証情報を確認
mount -t cifs //nas-addr/share /mnt/nas -o username=user,password=pass
```

### ffmpeg が遅い
- CPU 集約的な処理なので、マルチコア環境推奨
- `go run` ではなく、`go build` でコンパイル版を実行
- GPU アクセラレーション設定：環境によって NVENC、VAAPI、QSV を有効化

## 本番環境チェックリスト

- [ ] ffmpeg がインストールされている
- [ ] ポート 8080 が開放されている（またはファイアウォール設定済み）
- [ ] データベースディレクトリに書き込み権限がある
- [ ] ストレージ（NAS/ローカル）にアクセス可能
- [ ] systemd サービスが自動起動設定されている
- [ ] ログ確認用に journalctl を設定している
- [ ] Cloudflare Tunnel または nginx でリバースプロキシ設定

## ログ確認

```bash
# journalctl（systemd の場合）
sudo journalctl -u hideme -f

# ファイルログ（スタンドアロンの場合）
./hideme > hideme.log 2>&1 &
tail -f hideme.log
```
