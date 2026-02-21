#!/usr/bin/env bash
set -euo pipefail

IMAGE=""
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
PROJECT_NAME="dabdub"

usage() {
  echo "Usage: deploy.sh --image <image> [--compose-file <path>] [--env-file <path>] [--project-name <name>]" >&2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --image)
      IMAGE="$2"
      shift 2
      ;;
    --compose-file)
      COMPOSE_FILE="$2"
      shift 2
      ;;
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --project-name)
      PROJECT_NAME="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$IMAGE" ]]; then
  echo "Missing required --image argument." >&2
  usage
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose file not found: $COMPOSE_FILE" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

echo "Deploying image: $IMAGE"
IMAGE="$IMAGE" docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --pull always
