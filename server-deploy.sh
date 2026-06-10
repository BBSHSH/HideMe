#!/bin/bash
set -e
cd /home/yzl/hideme/HideMe

echo "==> git pull"
git pull

echo "==> npm build"
cd client && npm run build && cd ..

echo "==> sync dist"
rsync -a --delete client/dist/ dist/

echo "==> go build"
cd server && go build -o ../api ./cmd/api && cd ..

echo "==> restart"
sudo systemctl restart hideme

echo "==> done"
