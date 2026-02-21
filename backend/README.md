# DabDub Backend (NestJS)

## Setup

```bash
npm install
cp .env.example .env
npm run start:dev

## Monitoring

- **Metrics**: `/metrics` (Prometheus format)
- **Health**: `/health`
- **Readiness**: `/health/ready`
- **Liveness**: `/health/live`
