# HideMe Linux 公開ガイド（Cloudflare Tunnel）

## 最短セットアップ（5分）

### Step 1: Linux サーバーで準備

```bash
# root ユーザーで実行
cd /root
git clone https://github.com/your-repo/HideMe.git
cd HideMe
chmod +x deploy.sh

# ffmpeg インストール（自動）
sudo bash setup-linux.sh

# ビルド
./deploy.sh
```

### Step 2: HideMe サーバー起動（テスト）

```bash
cd server
./hideme
```

ブラウザで `http://localhost:8080` にアクセスして、UI が表示されることを確認。

**Ctrl+C** で停止。

### Step 3: Cloudflare Tunnel インストール

```bash
# cloudflared ダウンロード＆インストール
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# バージョン確認
cloudflared --version
```

### Step 4: Cloudflare にログイン

```bash
cloudflared tunnel login
```

ブラウザが開きます。Cloudflare アカウントにログインしてアクセス許可を与えてください。

### Step 5: トンネル作成

```bash
cloudflared tunnel create hideme
```

出力例：
```
Tunnel credentials written to /root/.cloudflared/<TUNNEL_ID>.json
Tunnel '<TUNNEL_ID>' created successfully.
```

**TUNNEL_ID を控えておく**

### Step 6: トンネル設定ファイル作成

```bash
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: hideme.example.com
    service: http://localhost:8080
  - hostname: *.hideme.example.com
    service: http://localhost:8080
  - service: http_status:404
EOF
```

**`example.com` を自分のドメインに変更してください。**

### Step 7: DNS レコード設定（Cloudflare Dashboard）

Cloudflare の管理画面で DNS レコード追加：

| Type | Name | Content |
|---|---|---|
| CNAME | hideme | `<TUNNEL_ID>.cfargotunnel.com` |

または

```bash
cloudflared tunnel route dns hideme example.com
```

### Step 8: トンネル起動（前景）

```bash
cloudflared tunnel run hideme
```

成功すればこう表示：
```
2026-06-06T12:00:00Z INF Tunnel register success
2026-06-06T12:00:01Z INF Tunnel running at hideme.example.com
```

---

## 本番設定（systemd 自動起動）

### Step 1: サーバー停止

前画面で **Ctrl+C** を押す

### Step 2: HideMe を systemd サービスで起動

```bash
sudo cp hideme.service /etc/systemd/system/
sudo systemctl enable hideme
sudo systemctl start hideme
sudo systemctl status hideme
```

### Step 3: cloudflared を systemd で起動

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

### Step 4: ログ確認

```bash
# HideMe ログ
sudo journalctl -u hideme -f

# Cloudflare Tunnel ログ
sudo journalctl -u cloudflared -f
```

---

## 固定ドメインで公開（独自ドメイン使用）

### Cloudflare 側の設定

1. **Cloudflare Dashboard** にログイン
2. ドメイン選択 → DNS
3. CNAME レコード追加：
   - 名前: `hideme`
   - コンテンツ: `<TUNNEL_ID>.cfargotunnel.com`
   - Proxy status: Proxied ✅

4. SSL/TLS 設定：
   - Mode: **Full**

### アクセス制限（オプション）

Cloudflare でアクセス制限を追加：

```bash
cloudflared tunnel route lb hideme example.com
# または
cloudflared access app create \
  --url https://hideme.example.com \
  --name "HideMe"
```

---

## トラブルシューティング

### トンネルが接続できない

```bash
# 再ログイン
cloudflared tunnel logout
cloudflared tunnel login

# トンネル削除・再作成
cloudflared tunnel delete hideme
cloudflared tunnel create hideme
```

### HideMe にアクセスできない

```bash
# ローカルでアクセス確認
curl http://localhost:8080

# ファイアウォール確認（ポート 8080 必須ではない）
ss -tlnp | grep 8080
```

### DNS が反映されない

```bash
# DNS 確認
nslookup hideme.example.com

# キャッシュクリア（CloudFlare Dashboard）
キャッシュ → 全てクリア
```

---

## まとめ

| 段階 | コマンド |
|---|---|
| **ビルド** | `cd HideMe && ./deploy.sh` |
| **起動（テスト）** | `cd server && ./hideme` |
| **トンネル起動** | `cloudflared tunnel run hideme` |
| **本番（自動起動）** | `sudo systemctl start hideme cloudflared` |
| **ログ確認** | `sudo journalctl -u hideme -f` |

✅ **これで `https://hideme.example.com` からアクセス可能！**
