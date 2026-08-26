#!/bin/sh
set -e

echo "=== CadorDigital Backend ==="
echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Seeding database (idempotent)..."
node dist/seed.js 2>/dev/null || npx tsx src/seed.ts 2>/dev/null || echo "Seed skipped (already seeded or build-only image)"

echo "Starting application..."
exec node dist/app.js
