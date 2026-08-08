#!/usr/bin/env bash
# Runs the visual tests inside the same image CI uses.
#
# Screenshot baselines only match the environment that produced them — fonts and rendering
# differ between this machine and a GitHub runner. So the baselines in
# tests/ui/visual/*-snapshots/ are generated in the Playwright container, and comparing
# against them has to happen there too. Running `npx playwright test --grep @visual` directly
# on the host will fail, and that is expected.
#
#   ./scripts/visual.sh                      compare against the committed baselines
#   ./scripts/visual.sh --update-snapshots   regenerate them (review the PNGs before committing)
#
# TestMart must already be running on :5173 (`npm run dev` in the app repo).
set -euo pipefail

IMAGE="mcr.microsoft.com/playwright:v1.62.0-noble"

docker run --rm --network host \
  -v "$PWD":/work -w /work \
  --user "$(id -u):$(id -g)" -e HOME=/tmp \
  -e BASE_URL="${BASE_URL:-http://localhost:5173}" \
  "$IMAGE" \
  npx playwright test --grep @visual --project=chromium "$@"
