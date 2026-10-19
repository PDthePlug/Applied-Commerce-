#!/usr/bin/env bash
# Codex Cloud setup for an isolated, local-mode Applied Commerce UI audit.
# No sudo / root privileges are required by this script.
set -euo pipefail

cd "$(dirname "$0")/.."

node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 13)) { console.error("Node >=22.13.0 required (Node 22 or 24 recommended)"); process.exit(1); }'
command -v npm >/dev/null
command -v python3 >/dev/null

# Build offline/local-mode: never initialize a production Supabase connection.
export NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE=local
export NEXT_PUBLIC_SUPABASE_URL=""
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""
unset SUPABASE_SERVICE_ROLE_KEY SUPABASE_SECRET_KEY AC_ALLOW_PRODUCTION_ROLE_TESTS || true

npm ci

# Codex Cloud normally provides an existing Chromium executable. Prefer it
# when the environment explicitly specifies AC_BROWSER_EXECUTABLE.
# Avoid 'playwright install --with-deps': apt/system libraries require root.
if [[ -n "${AC_BROWSER_EXECUTABLE:-}" ]]; then
  if [[ ! -x "$AC_BROWSER_EXECUTABLE" ]]; then
    echo "AC_BROWSER_EXECUTABLE does not point to an executable browser: $AC_BROWSER_EXECUTABLE" >&2
    exit 1
  fi
  echo "Using existing Chromium: $AC_BROWSER_EXECUTABLE"
else
  echo "No AC_BROWSER_EXECUTABLE specified; installing user-scoped Playwright Chromium (no system dependencies)."
  npx playwright install chromium
fi

mkdir -p test-results
npm run build

echo "Codex local-mode build is ready."
echo "Baseline: npx playwright test --config=playwright.config.mjs"
echo "UI sweep: npx playwright test --config=playwright.audit.config.mjs"
echo "Authenticated staging flows require separate, explicitly approved private fixtures."
