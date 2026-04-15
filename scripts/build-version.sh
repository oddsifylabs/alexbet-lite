#!/usr/bin/env bash
set -euo pipefail

VERSION="${APP_VERSION:-v2026.04.15.4}"
COMMIT="${COMMIT_REF:-$(git rev-parse --short HEAD 2>/dev/null || echo local)}"
BRANCH="${BRANCH:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo local)}"

cat > version.js <<EOF
window.__ALEXBET_BUILD__ = {
  version: ${VERSION@Q},
  commit: ${COMMIT@Q},
  branch: ${BRANCH@Q}
};
EOF

echo "Generated version.js for ${VERSION} (${COMMIT}) on ${BRANCH}"
