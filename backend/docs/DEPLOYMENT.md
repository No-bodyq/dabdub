# Deployment & CI/CD

This document describes the GitHub Actions workflows, required secrets, and deployment setup for the backend service.

## Workflows

### CI (`.github/workflows/ci.yml`)
- Runs on every pull request.
- Steps: format check, lint, tests, coverage, build verification, npm audit, optional Snyk.
- Coverage is uploaded as an artifact and summarized in the job summary.

### Deploy (`.github/workflows/deploy.yml`)
- Builds and pushes a Docker image to GHCR on every push to `main`.
- Automatically deploys to staging.
- Production deploy requires manual approval via the `production` GitHub Environment.

### Rollback (`.github/workflows/rollback.yml`)
- Manual workflow to redeploy a specific image tag to staging or production.

## Required GitHub Environment setup

Create two GitHub Environments: `staging` and `production`.
- Configure required reviewers for `production` to enforce manual approval.
- Add environment-specific secrets listed below.

## Required secrets (per environment)

Deployment and registry:
- `SSH_PRIVATE_KEY`: SSH key with access to the server.
- `DEPLOY_HOST`: Hostname or IP of the server.
- `DEPLOY_USER`: SSH username.
- `DEPLOY_PORT`: Optional SSH port (default 22).
- `DEPLOY_PATH`: Path on server containing deployment assets (e.g. `/opt/dabdub`).
- `REGISTRY_USER`: Username for GHCR (often the GitHub username).
- `REGISTRY_TOKEN`: Token with `read:packages` access for GHCR pull on server.
- `HEALTHCHECK_URL`: Base URL for health checks (e.g. `https://staging.example.com`).

Security scanning:
- `SNYK_TOKEN`: Optional, enables Snyk scan in CI.

Notifications (optional):
- `SLACK_WEBHOOK_URL`: Slack incoming webhook URL.
- `SMTP_HOST`: SMTP server hostname.
- `SMTP_PORT`: SMTP server port.
- `SMTP_USERNAME`: SMTP username.
- `SMTP_PASSWORD`: SMTP password.
- `EMAIL_FROM`: From address (e.g. `ci@dabdub.xyz`).
- `EMAIL_TO`: Recipient address.

## Server prerequisites

On each environment server:
- Docker and Docker Compose installed.
- A directory matching `DEPLOY_PATH` exists.
- The backend `.env` file exists at `${DEPLOY_PATH}/.env`.
- The server can pull from GHCR using `REGISTRY_USER`/`REGISTRY_TOKEN`.

## Deployment assets

The workflow copies the following files to `${DEPLOY_PATH}` on the server:
- `backend/docker-compose.yml`
- `scripts/deploy.sh`

The compose file expects:
- `IMAGE` env var (set by deploy script)
- `APP_PORT` optionally set in `.env` (defaults to `4000`)

## Rollback

Run the **Rollback** workflow with:
- `environment`: `staging` or `production`
- `image_tag`: a previous image tag (e.g. a commit SHA)

## Branch protection guidance

Configure branch protection for `main`:
- Require status checks to pass before merging.
- Required check: `backend-ci` (from the CI workflow).
- Require at least one approval.
- Restrict direct pushes to `main`.
