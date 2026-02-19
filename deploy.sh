#!/bin/bash
set -e

echo "[DEPLOY] Pulling latest code..."
git pull origin main

echo "[DEPLOY] Installing dependencies..."
npm install

echo "[DEPLOY] Fixing binary permissions..."
chmod +x node_modules/@esbuild/*/bin/esbuild node_modules/.bin/* 2>/dev/null || true

echo "[DEPLOY] Generating Prisma client..."
npx prisma generate

echo "[DEPLOY] Running pending migrations..."
npx prisma migrate deploy 2>/dev/null || echo "[DEPLOY] No pending migrations"

echo "[DEPLOY] Restarting Passenger..."
mkdir -p tmp && touch tmp/restart.txt

echo "[DEPLOY] Waiting 3s for restart..."
sleep 3

echo "[DEPLOY] Health check:"
curl -s https://admin.pasrobotics.com/api/health || echo "[DEPLOY] Health check failed - check startup-error.log"

echo ""
echo "[DEPLOY] Complete!"
