#!/usr/bin/env bash
set -euo pipefail

kubectl create secret docker-registry ghcr -n github \
  --docker-server=ghcr.io \
  --docker-username="$GITHUB_PAT" \
  --docker-password="$GITHUB_PAT" \
  --docker-email="$GITHUB_EMAIL"
