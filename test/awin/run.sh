#!/usr/bin/env bash
# Awin tracking tests for the dashboard: transpiles the two pure modules with
# the project's own TypeScript into a temp dir and runs them on node:test.
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT
npx tsc --outDir "$OUT" --rootDir src --module commonjs --target es2022 \
  --skipLibCheck --esModuleInterop \
  src/lib/awinClick.ts src/lib/verifiedAwinConversion.ts
AWIN_TEST_OUT="$OUT/lib" node --test test/awin/awin-dashboard.test.cjs
