# Quick Start Guide

## Installation & Setup

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+

### 2. Clone/Extract Project

```bash
cd "Refund Management"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your database and Redis credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=refund_db
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 5. Build Project

```bash
npm run build
```

### 6. Start Application

**Development** (with hot reload):

```bash
npm run start:dev
```

**Production**:

```bash
npm start
```

The API will be available at `http://localhost:3000`

### 7. Access Documentation

- **Swagger UI**: http://localhost:3000/api/docs
- **API Base**: http://localhost:3000/api

---

## Running with Docker

```bash
# Build and start all services
docker-compose up

# Services available:
# - Application: http://localhost:3000
# - PostgreSQL: localhost:5432 (postgres/postgres)
# - Redis: localhost:6379
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov
```

---

## Project Structure

```
src/
├── common/               # Decorators, enums, utilities
├── config/              # Database and queue configurations
├── database/            # Base entity definitions
├── modules/
│   ├── refunds/         # Refund API and business logic
│   ├── settlements/     # Settlement API and business logic
│   ├── audit/           # Audit logging
│   └── jobs/            # Background job processors
├── app.module.ts        # Root module
└── main.ts              # Application entry point

test/                    # Unit tests
README.md                # Full documentation
IMPLEMENTATION.md        # Implementation details
```

---

## Key APIs

### Refund Endpoints

**Initiate Refund**

```
POST /api/v1/transactions/:id/refund
Body: {
  "refundAmountUsd": "100.00",
  "method": "CRYPTO_ONCHAIN",
  "reason": "CUSTOMER_REQUEST",
  "internalNote": "Customer requested refund due to double charge"
}
```

**List Refunds**

```
GET /api/v1/refunds?merchantId=xxx&status=COMPLETED&page=1&limit=20
```

**Get Refund Detail**

```
GET /api/v1/refunds/:id
```

**Retry Failed Refund**

```
POST /api/v1/refunds/:id/retry
```

### Settlement Endpoints

**List Settlements**

```
GET /api/v1/settlements?merchantId=xxx&status=PENDING&page=1&limit=20
```

**Get Pending Dashboard**

```
GET /api/v1/settlements/pending
```

**Manual Settlement Trigger**

```
POST /api/v1/settlements/trigger
Body: {
  "merchantId": "uuid",
  "transactionIds": ["tx-1", "tx-2"],
  "reason": "Manual settlement for end-of-month"
}
```

**Put Settlement On Hold**

```
POST /api/v1/settlements/:id/put-on-hold
Body: {
  "reason": "Pending compliance review"
}
```

**Retry Failed Settlement**

```
POST /api/v1/settlements/:id/retry
```

---

## Key Features

✅ **Refund Workflow**

- Crypto on-chain and fiat deduction methods
- Partial refunds with over-refund prevention
- Async processing with job queues
- Automatic and manual retries (max 3)
- Full audit logging

✅ **Settlement Workflow**

- Batch transaction processing
- Pending settlement dashboard
- Manual settlement triggers
- Hold mechanism for settlements
- Retry capability with limits

✅ **Architecture**

- Clean NestJS modular structure
- Comprehensive error handling
- Permission-based access control
- Full audit trail system
- Job queue with Bull/Redis

✅ **Testing**

- Unit tests for critical business logic
- Validation tests
- Test coverage reporting

---

## Troubleshooting

**Database Connection Error**

```
Check PostgreSQL is running:
- psql connection string correct in .env
- Database exists
- Credentials are valid
```

**Redis Connection Error**

```
Check Redis is running:
- Redis service started
- Host/port correct in .env
- Redis accessible
```

**Build Errors**

```
npm cache clean --force
rm -rf node_modules dist
npm install
npm run build
```

**Port Already in Use**

```
# Change PORT in .env or terminate process using port 3000
lsof -i :3000  (macOS/Linux)
netstat -ano | findstr :3000  (Windows)
```

---

## Environment

The project is configured for:

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: NestJS 11+
- **Database**: PostgreSQL 12+
- **Cache/Queue**: Redis 6+
- **Package Manager**: npm

---

## Documentation

- [README.md](./README.md) - Full API documentation and setup guide
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Implementation details and acceptance criteria
- Swagger UI at `/api/docs` - Interactive API documentation

---

## Support

For detailed information:

1. Check [README.md](./README.md) for comprehensive documentation
2. Review [IMPLEMENTATION.md](./IMPLEMENTATION.md) for implementation details
3. Check source code comments for specific logic
4. Access Swagger UI for endpoint documentation

---

Generated: February 20, 2026
