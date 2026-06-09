#!/bin/bash
set -e

SERVER_USER="yzl"
SERVER_HOST="hideme.jp"

echo "==> Pushing to GitHub..."
git push origin main

echo "==> Deploying to server..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
  cd ~/hideme/HideMe
  git pull origin main
  cd server && go build -o ../api ./cmd/api && cd ..
  sudo systemctl restart hideme
  echo "Deploy complete"
EOF

echo "==> Done!"
