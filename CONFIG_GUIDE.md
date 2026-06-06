# HideMe 設定ガイド

## クイックスタート

### 1. config.yaml を作成

```bash
cd ~/hideme/HideMe/server

# インタラクティブセットアップ
bash setup-config.sh

# または、テンプレートをコピーして手動編集
cp config.example.yaml config.yaml
vim config.yaml
```

### 2. サーバー起動

```bash
./hideme
```

---

## 設定ファイル (config.yaml)

### サーバー設定

```yaml
server:
  port: 8080           # リッスンポート
  host: "0.0.0.0"      # バインドアドレス
```

### 公開 URL（重要）

```yaml
public:
  url: "https://hideme.example.com"  # Discord OAuth リダイレクト URI に使用
```

**値の例：**
- ローカル開発: `http://localhost:8080`
- Cloudflare Tunnel: `https://hideme.xxxx.cfargotunnel.com`
- 独自ドメイン: `https://hideme.example.com`

### ストレージ設定

```yaml
storage:
  type: "local"  # "local" または "nas"
  
  # ローカルストレージ
  local:
    base_dir: "./uploads"
  
  # NAS ストレージ
  nas:
    host: "192.168.1.100"
    user: "admin"
    password: "password"
    share: "HideMe/uploads"
    port: 445
```

### Discord OAuth2

```yaml
discord:
  client_id: "YOUR_CLIENT_ID"
  client_secret: "YOUR_CLIENT_SECRET"
  guild_id: ""           # 特定サーバーのみ許可（空欄で全員）
  required_role: ""      # 特定ロール必須（空欄で制限なし）
```

**取得方法：**
1. https://discord.com/developers/applications
2. 「New Application」で作成
3. OAuth2 > General から Client ID, Client Secret コピー
4. Redirect: `{public.url}/v1/auth/discord/callback`

### FFmpeg 設定

```yaml
ffmpeg:
  path: "ffmpeg"  # PATH から検索、または /usr/bin/ffmpeg などの絶対パス
```

### ロギング

```yaml
logging:
  level: "info"   # debug, info, warn, error
  format: "json"  # json または text
```

---

## 環境変数での上書き

YAML ファイルの設定は環境変数で上書きできます：

```bash
# 例：本番環境での URL を上書き
export PUBLIC_URL="https://hideme.example.com"
export DISCORD_CLIENT_ID="xxx"
export DISCORD_CLIENT_SECRET="yyy"

./hideme
```

---

## 環境別設定例

### 開発（ローカル）

```yaml
server:
  port: 8080
  host: "127.0.0.1"

public:
  url: "http://localhost:8080"

storage:
  type: "local"
  local:
    base_dir: "./uploads"

logging:
  level: "debug"
```

### 本番（Cloudflare Tunnel）

```yaml
server:
  port: 8080
  host: "0.0.0.0"

public:
  url: "https://hideme.xxxx.cfargotunnel.com"

storage:
  type: "nas"
  nas:
    host: "192.168.1.100"
    user: "backup"
    password: "secure_pass"
    share: "HideMe/uploads"

discord:
  client_id: "PROD_CLIENT_ID"
  client_secret: "PROD_CLIENT_SECRET"

logging:
  level: "info"
  format: "json"
```

---

## トラブルシューティング

### Discord OAuth でエラー

```
400 (Bad Request)
```

**原因:** Client ID が空、または Redirect URI が設定と一致していない

**解決：**
1. `public.url` が正しいことを確認
2. Discord Developer Portal で Redirect URI を `{public.url}/v1/auth/discord/callback` に設定
3. サーバーを再起動

### ストレージ接続失敗

```
NAS connection refused
```

**解決：**
```bash
# NAS アクセス確認
mount -t cifs //{nas.host}/{nas.share} /mnt/nas \
  -o username={user},password={password}

# config.yaml の nas.host, user, password を確認
```

### ffmpeg not found

```bash
# インストール確認
which ffmpeg

# パスが異なる場合は config.yaml で指定
ffmpeg:
  path: "/usr/bin/ffmpeg"
```

---

## systemd で自動起動

```bash
sudo systemctl edit hideme
```

環境変数を設定：

```ini
[Service]
Environment="PUBLIC_URL=https://hideme.example.com"
```

再起動：

```bash
sudo systemctl restart hideme
```
