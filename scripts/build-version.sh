#!/usr/bin/env bash
set -euo pipefail

VERSION="${APP_VERSION:-v2026.04.15.5}"
RAW_COMMIT="${COMMIT_REF:-$(git rev-parse HEAD 2>/dev/null || echo local)}"
COMMIT="${RAW_COMMIT:0:7}"
BRANCH="${BRANCH:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo local)}"

cat > version.js <<EOF
window.__ALEXBET_BUILD__ = {
  version: ${VERSION@Q},
  commit: ${COMMIT@Q},
  branch: ${BRANCH@Q}
};
EOF

echo "Generated version.js for ${VERSION} (${COMMIT}) on ${BRANCH}"
