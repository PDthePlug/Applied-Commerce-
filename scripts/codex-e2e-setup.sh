#!/usr/bin/env bash
# Codex Cloud install script for an isolated, local-mode Applied Commerce UI audit.
set -euo pipefail

cd "$(dirname "$0")/.."

node -e 'const major=Number(process.versions.node.split(".")[0]);if(major<22){console.error("Node >=22.13 required (Node 22 or 24 recommended)");process.exit(1)}'
command -v npm >/dev/null
command -v python3 >/dev/null

# Keep automated browser builds disconnected from production Supabase by default.
export NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE=local
export NEXT_PUBLIC_SUPABASE_URL=""
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""
unset SUPABASE_SERVICE_ROLE_KEY SUPABASE_SECRET_KEY || true
unset AC_ALLOW_PRODUCTION_ROLE_TESTS || true

npm ci
npx playwright install --with-deps chromium
mkdir -p test-results
npm run build

echo "Codex local-mode build and Playwright Chromium are ready."
echo "Baseline: npx playwright test --config=playwright.config.mjs"
echo "UI sweep: npx playwright test --config=playwright.audit.config.mjs"
echo "Authenticated staging flows require separate, explicit private fixtures."
