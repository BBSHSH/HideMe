# HideMe

セルフホスト型のプライベートストレージアプリ。  
ファイル管理・コレクション・ダイレクトメッセージ・チャットをひとつにまとめたプラットフォームです。

## Features

- **ファイル管理** — アップロード・ダウンロード・整理
- **コレクション** — ファイルをグループ管理
- **ダイレクトメッセージ** — ユーザー間のプライベートDM
- **チャット** — チャンネルベースのグループチャット
- **動画処理** — ブラウザ上でFFmpegを使った変換・編集
- **NAS対応** — SMB / SFTP 経由でNASストレージに接続可能
- **HTTPS対応** — 証明書があれば自動でHTTPS起動

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | Go + Gin |
| Database | SQLite |
| Auth | JWT |
| Realtime | WebSocket (gorilla/websocket) |
| Storage | Local / NAS (SMB・SFTP) |

## Getting Started

### 必要なもの

- Go 1.25+
- Node.js 18+
- (任意) NASサーバー

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/BBSHSH/HideMe.git
cd HideMe
