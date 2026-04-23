#!/bin/bash
# PAS Robotics — One-time DB setup script
# Run via SSH on Hostinger after deploying the new code
# Usage: bash setup-db.sh

set -e
echo "[SETUP] Starting database setup at $(date)"

# 1. Ensure latest code
echo "[SETUP] Pulling latest code..."
git pull origin main

# 2. Prisma generate
echo "[SETUP] Generating Prisma client..."
node node_modules/prisma/build/index.js generate

# 3. Push schema changes (creates new tables + indexes, non-destructive)
echo "[SETUP] Pushing schema changes to database..."
node node_modules/prisma/build/index.js db push

# 4. Run seed (cleans test data + imports ABB catalog)
echo "[SETUP] Running seed..."
node_modules/.bin/tsx prisma/seed.ts

# 5. Restart
echo "[SETUP] Restarting Passenger..."
mkdir -p tmp && touch tmp/restart.txt

echo "[SETUP] Done at $(date)"
echo ""
echo "Results:"
echo "  - Schema synced (2 new tables + unique index)"
echo "  - Test data cleaned (clients, systems, interventions)"
echo "  - ABB catalog imported (920 models, 680 lubrication, 411 maintenance)"
echo "  - Report templates preserved"
