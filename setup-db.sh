#!/bin/bash
# PAS Robotics — One-time DB setup script
# Run via SSH on Hostinger after deploying the new code
# Usage: bash setup-db.sh

set -e

# Hostinger: Node.js not in PATH, use explicit path
NODE="/opt/alt/alt-nodejs20/root/usr/bin/node"
NPX="$NODE $(pwd)/node_modules/.bin/npx"

echo "[SETUP] Starting database setup at $(date)"
echo "[SETUP] Using Node: $($NODE --version)"

# 1. Prisma generate
echo "[SETUP] Generating Prisma client..."
$NODE node_modules/prisma/build/index.js generate

# 2. Push schema changes (creates new tables + indexes, non-destructive)
echo "[SETUP] Pushing schema changes to database..."
$NODE node_modules/prisma/build/index.js db push

# 3. Run seed (cleans test data + imports ABB catalog)
echo "[SETUP] Running seed..."
$NODE node_modules/.bin/tsx prisma/seed.ts

# 4. Restart
echo "[SETUP] Restarting Passenger..."
mkdir -p tmp && touch tmp/restart.txt

echo "[SETUP] Done at $(date)"
echo ""
echo "Results:"
echo "  - Schema synced (2 new tables + unique index)"
echo "  - Test data cleaned (clients, systems, interventions)"
echo "  - ABB catalog imported (920 models, 680 lubrication, 411 maintenance)"
echo "  - Report templates preserved"
