#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"
RETRIES="${HEALTHCHECK_RETRIES:-30}"
SLEEP_SECONDS="${HEALTHCHECK_SLEEP_SECONDS:-5}"

usage() {
  echo "Usage: healthcheck.sh <base-url>" >&2
  echo "Example: healthcheck.sh https://staging.example.com" >&2
}

if [[ -z "$BASE_URL" ]]; then
  usage
  exit 1
fi

check_endpoint() {
  local endpoint="$1"
  for ((i=1; i<=RETRIES; i++)); do
    if curl -fsS --max-time 5 "${BASE_URL}${endpoint}" >/dev/null; then
      echo "Healthy: ${BASE_URL}${endpoint}"
      return 0
    fi
    echo "Waiting for ${BASE_URL}${endpoint} (${i}/${RETRIES})..."
    sleep "$SLEEP_SECONDS"
  done
  return 1
}

check_endpoint "/health"
check_endpoint "/health/ready"
