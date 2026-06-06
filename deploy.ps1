# HideMe デプロイスクリプト
# 使い方: .\deploy.ps1

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

Write-Host "== [1/3] フロントエンド ビルド ==" -ForegroundColor Cyan
Set-Location "$Root\client"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "フロントエンドビルド失敗"; exit 1 }

Write-Host "== [2/3] dist を server へコピー ==" -ForegroundColor Cyan
$distSrc = "$Root\client\dist"
$distDst = "$Root\server\dist"
if (Test-Path $distDst) { Remove-Item $distDst -Recurse -Force }
Copy-Item $distSrc $distDst -Recurse
Write-Host "  $distSrc -> $distDst"

Write-Host "== [3/3] サーバー ビルド ==" -ForegroundColor Cyan
Set-Location "$Root\server"
go build -o hideme.exe ./cmd/api
if ($LASTEXITCODE -ne 0) { Write-Error "サーバービルド失敗"; exit 1 }

Write-Host ""
Write-Host "== デプロイ完了 ==" -ForegroundColor Green
Write-Host "起動コマンド: cd server && .\hideme.exe" -ForegroundColor Yellow
Write-Host "ポート: 8080 (PORT 環境変数で変更可)"
