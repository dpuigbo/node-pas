#!/bin/bash
# PAS Robotics — Deploy script
# Covers: git pull, npm install, permissions, prisma, .env check, restart

echo "[DEPLOY] Starting at $(date)"

# 1. Pull latest code
echo "[DEPLOY] git pull..."
git pull origin main 2>&1 || { echo "[DEPLOY] ERROR: git pull failed"; exit 1; }

# 2. Install dependencies (skip if node_modules recent)
echo "[DEPLOY] npm install..."
npm install 2>&1 || echo "[DEPLOY] WARN: npm install had issues"

# 3. Fix binary permissions (Hostinger loses them)
echo "[DEPLOY] Fixing permissions..."
chmod +x node_modules/@esbuild/*/bin/esbuild 2>/dev/null
chmod +x node_modules/.bin/* 2>/dev/null
chmod +x client/node_modules/@esbuild/*/bin/esbuild 2>/dev/null
chmod +x client/node_modules/.bin/* 2>/dev/null

# 4. Prisma generate
echo "[DEPLOY] Prisma generate..."
npx prisma generate 2>&1 || node node_modules/prisma/build/index.js generate 2>&1

# 5. Prisma migrations
echo "[DEPLOY] Prisma migrate deploy..."
npx prisma migrate deploy 2>&1 || echo "[DEPLOY] No pending migrations"

# 6. Check .env exists
if [ ! -f .env ]; then
  echo "[DEPLOY] WARNING: .env file missing! App will fail to connect to DB."
  echo "[DEPLOY] Create it with: nano .env"
fi

# 7. Restart Passenger
echo "[DEPLOY] Restarting Passenger..."
mkdir -p tmp
touch tmp/restart.txt

# 8. Wait and health check
echo "[DEPLOY] Waiting 3s..."
sleep 3
echo "[DEPLOY] Health check:"
curl -sf https://admin.pasrobotics.com/api/health && echo "" || echo "[DEPLOY] FAIL — check: cat startup-error.log"

echo "[DEPLOY] Done at $(date)"
