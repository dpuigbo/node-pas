#!/bin/bash
# PAS Robotics — Lightweight deploy script for Hostinger
# Avoids heavy operations (npm install) unless necessary

echo "[DEPLOY] Starting at $(date)"

# 1. Pull latest code
echo "[DEPLOY] git pull..."
git pull origin main 2>&1 || { echo "[DEPLOY] ERROR: git pull failed"; exit 1; }

# 2. Fix binary permissions (Hostinger loses them)
chmod +x node_modules/@esbuild/*/bin/esbuild node_modules/.bin/* 2>/dev/null

# 3. Prisma generate (lightweight — uses local binary)
echo "[DEPLOY] Prisma generate..."
node node_modules/prisma/build/index.js generate 2>&1 || echo "[DEPLOY] WARN: prisma generate failed"

# 4. Check .env exists
if [ ! -f .env ]; then
  echo "[DEPLOY] WARNING: .env file missing!"
fi

# 5. Restart Passenger
echo "[DEPLOY] Restarting..."
mkdir -p tmp && touch tmp/restart.txt

echo "[DEPLOY] Done at $(date)"
