# Refund & Settlement Management API

A comprehensive NestJS-based API for managing crypto transaction refunds and settlement workflows. The system handles both on-chain crypto refunds and fiat settlement deductions with full audit logging and job queue processing.

## Features

### Refund Workflow

- **Multiple Refund Methods**: CRYPTO_ONCHAIN (return tokens to sender) or FIAT_DEDUCTION (deduct from next settlement)
- **Partial Refunds**: Support refunding any amount up to the original transaction
- **Over-Refund Protection**: Validation prevents exceeding transaction amounts
- **Merchant Balance Validation**: Ensures merchants have sufficient balance for fiat deductions
- **Async Processing**: Refunds are processed via job queue for reliability
- **Retry Logic**: Automatic and manual retry with 3-attempt limit
- **Comprehensive Audit Logging**: All refund actions are logged with actor identity

### Settlement Workflow

- **Settlement Management**: Organize transactions into settlements for batch processing
- **Manual Controls**: Finance admins can manually trigger settlements for specific merchants
- **Hold Mechanism**: Prevent specific settlements from processing
- **Pending Dashboard**: Real-time visibility into unsettled transactions grouped by merchant
- **Retry Management**: Failed settlements can be retried (max 3 times)
- **Full Audit Trail**: All settlement mutations logged with admin identity
- **Exchange Rate Tracking**: Records exchange rates used for each settlement

## Project Structure

```
src/
├── common/
│   ├── decorators/              # Authorization and custom decorators
│   ├── enums/                   # Enums for status, methods, reasons
│   ├── guards/                  # Authorization guards
│   ├── filters/                 # Exception filters
│   └── interceptors/            # Response interceptors
├── config/                      # Configuration files
│   ├── typeorm.config.ts        # Database configuration
│   └── bull.config.ts           # Job queue configuration
├── database/
│   ├── base.entity.ts           # Base entity with id, createdAt, updatedAt
│   └── migrations/              # Database migrations
├── modules/
│   ├── refunds/                 # Refund module
│   │   ├── entities/            # Refund entity
│   │   ├── dtos/                # Data transfer objects
│   │   ├── services/            # Business logic
│   │   ├── controllers/         # API endpoints
│   │   └── refund.module.ts     # Module definition
│   ├── settlements/             # Settlement module
│   │   ├── entities/            # Settlement entity
│   │   ├── dtos/                # Data transfer objects
│   │   ├── services/            # Business logic
│   │   ├── controllers/         # API endpoints
│   │   └── settlement.module.ts # Module definition
│   ├── audit/                   # Audit logging module
│   │   ├── entities/            # Audit log entity
│   │   ├── services/            # Audit service
│   │   └── audit.module.ts      # Module definition
│   └── jobs/                    # Job queue processors
│       ├── processors/          # Job processors
│       └── jobs.module.ts       # Module definition
├── app.module.ts                # Application module
└── main.ts                      # Application entry point
test/
├── refunds/                     # Refund tests
├── settlements/                 # Settlement tests
```

## API Endpoints

### Refunds

#### POST /api/v1/transactions/:id/refund

Initiate a new refund for a transaction.

**Permissions**: `transactions:refund`

**Request Body**:

```json
{
  "refundAmountUsd": "100.00",
  "method": "CRYPTO_ONCHAIN",
  "reason": "CUSTOMER_REQUEST",
  "internalNote": "Customer requested refund due to double charge"
}
```

**Validation**:

- Transaction must exist and be in SETTLED or CONFIRMED status
- Refund amount cannot exceed (transaction amount - already refunded)
- For FIAT_DEDUCTION: merchant must have sufficient balance
- Internal note must be 20-2000 characters

**Response**: Created Refund object with status INITIATED

---

#### GET /api/v1/refunds

List refunds with optional filtering.

**Permissions**: `transactions:read`

**Query Parameters**:

- `merchantId`: Filter by merchant
- `status`: Filter by refund status (INITIATED, PROCESSING, COMPLETED, FAILED)
- `method`: Filter by refund method (CRYPTO_ONCHAIN, FIAT_DEDUCTION)
- `reason`: Filter by reason
- `createdAfter`: Start date (ISO 8601)
- `createdBefore`: End date (ISO 8601)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response**:

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

#### GET /api/v1/refunds/:id

Get detailed information about a specific refund.

**Permissions**: `transactions:read`

**Response**: Refund object with all details including transaction summary and timeline

---

#### POST /api/v1/refunds/:id/retry

Retry a failed refund.

**Permissions**: `transactions:refund`

**Validation**:

- Refund status must be FAILED
- Retry count must be less than 3
- Max 3 total retry attempts allowed

**Response**: Updated Refund object with status INITIATED and incremented retryCount

---

### Settlements

#### GET /api/v1/settlements

List settlements with advanced filtering and sorting.

**Permissions**: `settlements:read`

**Query Parameters**:

- `merchantId`: Filter by merchant
- `status`: Filter by status (PENDING, PROCESSING, COMPLETED, FAILED, ON_HOLD)
- `currency`: Filter by settlement currency (ISO 4217)
- `createdAfter`: Start date
- `createdBefore`: End date
- `minAmount`: Minimum settlement amount
- `maxAmount`: Maximum settlement amount
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: ASC or DESC (default: DESC)

**Response**:

```json
{
  "data": [...],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

#### GET /api/v1/settlements/pending

Get pending settlements dashboard aggregated by merchant.

**Permissions**: `settlements:read`

**Response**:

```json
{
  "pendingByMerchant": [
    {
      "merchant": {
        "id": "uuid",
        "businessName": "Acme Corp"
      },
      "pendingTransactionCount": 45,
      "pendingVolumeUsd": "12450.00",
      "oldestPendingAt": "2026-02-19T08:00:00Z",
      "settlementConfig": {
        "currency": "USD",
        "frequency": "DAILY"
      }
    }
  ],
  "totals": {
    "merchantCount": 12,
    "transactionCount": 892,
    "volumeUsd": "234500.00"
  }
}
```

---

#### GET /api/v1/settlements/:id

Get detailed settlement information.

**Permissions**: `settlements:read`

**Response**: Settlement object with:

- Full merchant information
- All included transaction IDs (paginated for large batches)
- Fee breakdown
- Exchange rate details
- Bank transfer status
- Complete status timeline

---

#### POST /api/v1/settlements/:id/retry

Retry a failed settlement.

**Permissions**: `settlements:trigger`

**Validation**:

- Settlement status must be FAILED
- Retry count must be less than 3

**Response**: Updated Settlement object

---

#### POST /api/v1/settlements/:id/put-on-hold

Place a settlement on hold to prevent processing.

**Permissions**: `settlements:trigger`

**Request Body**:

```json
{
  "reason": "Pending compliance review for merchant"
}
```

**Validation**: Reason must be at least 20 characters

**Response**: Updated Settlement with status ON_HOLD

---

#### POST /api/v1/settlements/trigger

Manually trigger a settlement for a merchant.

**Permissions**: `settlements:trigger`

**Request Body**:

```json
{
  "merchantId": "uuid",
  "transactionIds": ["tx-1", "tx-2"],
  "reason": "Manual settlement for end-of-month processing"
}
```

**Validation**:

- Merchant must exist and be ACTIVE
- If transactionIds provided: all must belong to specified merchant
- All transactions must be in CONFIRMED or SETTLEMENT_PENDING status
- Reason must be at least 10 characters

**Response**: Created Settlement object

---

## Database Schema

### Refunds Table

```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY,
  transaction_id UUID NOT NULL,
  merchant_id UUID NOT NULL,
  initiated_by_id UUID NOT NULL,
  refund_amount_usd DECIMAL(20, 8) NOT NULL,
  refund_amount_token DECIMAL(30, 18),
  method ENUM('CRYPTO_ONCHAIN', 'FIAT_DEDUCTION') NOT NULL,
  status ENUM('INITIATED', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL,
  reason ENUM('CUSTOMER_REQUEST', 'FRAUD', 'DUPLICATE', 'COMPLIANCE', 'MERCHANT_ERROR', 'OTHER') NOT NULL,
  internal_note TEXT NOT NULL,
  on_chain_tx_hash VARCHAR,
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Settlements Table

```sql
CREATE TABLE settlements (
  id UUID PRIMARY KEY,
  merchant_id UUID NOT NULL,
  transaction_ids TEXT[] NOT NULL,
  gross_amount_usd DECIMAL(20, 8) NOT NULL,
  total_fees_usd DECIMAL(20, 8) NOT NULL,
  net_amount_fiat DECIMAL(20, 8) NOT NULL,
  settlement_currency VARCHAR(3) NOT NULL,
  exchange_rate_used DECIMAL(20, 8) NOT NULL,
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ON_HOLD') NOT NULL,
  bank_transfer_reference VARCHAR,
  liquidity_provider_ref VARCHAR,
  failure_reason TEXT,
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  transaction_count INT DEFAULT 0,
  retry_count INT DEFAULT 0,
  trigger_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  action ENUM(...) NOT NULL,
  actor_id UUID NOT NULL,
  actor_role VARCHAR NOT NULL,
  resource_type VARCHAR,
  resource_id UUID,
  changes JSONB NOT NULL,
  reason TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Setup & Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+

### Installation Steps

1. **Clone/Extract the project**

```bash
cd "Refund Management"
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your database and Redis credentials
```

4. **Build the project**

```bash
npm run build
```

5. **Run migrations** (if applicable)

```bash
npm run typeorm migration:run
```

6. **Start the application**

Development:

```bash
npm run start:dev
```

Production:

```bash
npm start
```

7. **Access the API**

- API: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api/docs

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov
```

## Testing Coverage

The test suite covers:

### Refund Service Tests

- ✅ Over-refund validation (prevents exceeding transaction amounts)
- ✅ Partial refund math (correct calculations for partial amounts)
- ✅ Retry limit enforcement (maximum 3 retries)
- ✅ Merchant balance validation for FIAT_DEDUCTION

### Settlement Service Tests

- ✅ Manual trigger validation (transaction ID ownership)
- ✅ ON_HOLD settlement exclusion
- ✅ Retry limit enforcement (3-attempt maximum)
- ✅ Audit logging for all mutations

## Job Queue Processing

### Refund Processing Queue

- Jobs process refunds asynchronously
- Automatic retry with exponential backoff
- Updates refund status and stores on-chain tx hash
- For CRYPTO_ONCHAIN: integrates with blockchain service
- For FIAT_DEDUCTION: deducts from merchant settlement

### Settlement Processing Queue

- Processes settlements asynchronously
- Generates bank transfer references
- Interfaces with liquidity provider or bank APIs
- Updates settlement status and completion time
- Respects ON_HOLD status (skips processing)

## Authorization & Permissions

The API uses permission-based authorization. The following permissions are enforced:

- `transactions:read` - View refund details
- `transactions:refund` - Create and retry refunds
- `settlements:read` - View settlement details
- `settlements:trigger` - Create and manage settlements

**Note**: Implement actual permission checking in the middleware/guards before production deployment.

## Error Handling

Standard HTTP status codes:

- `200 OK` - Successful request
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `403 Forbidden` - Insufficient permissions or merchant balance
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error responses include descriptive messages:

```json
{
  "statusCode": 400,
  "message": "Refund amount exceeds available balance",
  "error": "Bad Request"
}
```

## Production Considerations

Before deploying to production:

1. **Implement Real Authentication**
   - Replace mock user context with JWT verification
   - Implement role-based access control (RBAC)

2. **Implement Real Service Integrations**
   - Replace mock methods with actual blockchain service calls
   - Integrate with real bank/liquidity provider APIs
   - Connect to actual transaction and merchant services

3. **Security**
   - Enable HTTPS/TLS
   - Add rate limiting
   - Implement request signing
   - Add CORS restrictions
   - Encrypt sensitive data

4. **Monitoring & Logging**
   - Add structured logging
   - Implement error tracking (Sentry)
   - Add performance monitoring
   - Set up health checks

5. **Database**
   - Run migrations in production database
   - Set up backups and disaster recovery
   - Create appropriate indexes
   - Enable row-level security

6. **Job Queue**
   - Configure Redis persistence
   - Set up monitoring for job queue health
   - Implement job deadletter handling
   - Add alerts for failed jobs

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running
- Check DB credentials in .env
- Ensure database exists

### Redis Connection Issues

- Verify Redis is running
- Check Redis host/port in .env
- Ensure Redis is accessible

### Build Issues

- Delete node_modules and dist directories
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

## License

ISC
