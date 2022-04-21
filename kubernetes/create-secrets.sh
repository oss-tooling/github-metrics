#!/usr/bin/env bash
set -euo pipefail

kubectl create secret generic github-telemetry -n github \
  --from-literal=protocol="$GH_TELEMETRY_PROTOCOL" \
  --from-literal=host="$GH_TELEMETRY_HOST" \
  --from-literal=auth="$GH_TELEMETRY_AUTH" \
  --from-literal=secret="$GH_TELEMETRY_SECRET"
