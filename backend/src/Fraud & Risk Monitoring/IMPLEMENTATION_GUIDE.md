# Risk Monitoring System - Implementation Guide

## Overview

This document provides a comprehensive guide to the rule-based risk monitoring system implementation using NestJS, TypeORM, and PostgreSQL.

## Project Architecture

### Layered Architecture

```
Controllers (API Layer)
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access via TypeORM)
    ↓
Entities (Database Layer)
```

### Module Structure

```
src/
├── common/                    # Shared utilities
│   ├── enums/                # Shared enums
│   ├── guards/               # Authentication & permission guards
│   └── interfaces/           # Shared interfaces
├── modules/
│   └── risk/                 # Risk monitoring feature module
│       ├── controllers/      # HTTP endpoints
│       ├── services/         # Business logic
│       │   ├── rule-evaluation.service.ts    # Rule evaluation engine
│       │   └── risk-management.service.ts    # Alert & rule management
│       ├── entities/         # TypeORM entities
│       │   ├── risk-rule.entity.ts
│       │   └── risk-alert.entity.ts
│       ├── dto/              # Data validation
│       ├── enums/            # Risk-specific enums
│       ├── interfaces/       # Risk-specific interfaces
│       ├── tests/            # Unit & integration tests
│       └── risk.module.ts    # Module definition
├── config/                   # Configuration
│   └── typeorm.config.ts    # Database configuration
├── database/                 # Database layer
│   ├── migrations/          # TypeORM migrations
│   └── subscribers/         # TypeORM event subscribers
├── app.module.ts            # Root module
└── main.ts                  # Application entry
```

## Key Components

### 1. Rule Evaluation Engine (RuleEvaluationService)

Evaluates transactions and merchants against configured rules.

**Supported Rule Types:**

| Type                 | Condition                                  | Example                     |
| -------------------- | ------------------------------------------ | --------------------------- |
| TRANSACTION_AMOUNT   | Amount threshold with comparison           | > $50,000 USD               |
| TRANSACTION_VELOCITY | Count per time window                      | > 100 txns/hour             |
| MERCHANT_VOLUME      | Total volume threshold                     | > $1M                       |
| ADDRESS_BLACKLIST    | Source address matching (case-insensitive) | Match blacklisted addresses |
| COUNTRY_BLOCK        | Source country blocking                    | Block from KP, IR, SY       |

**Implementation Details:**

```typescript
// Example: Evaluate transaction amount rule
evaluateTransactionAgainstRule(
  RiskRuleType.TRANSACTION_AMOUNT,
  { threshold: 50000, currency: 'USD', comparison: 'gt' },
  { amount: 75000, currency: 'USD', ... }
) // Returns: true (rule triggered)
```

### 2. Risk Management Service (RiskManagementService)

Manages CRUD operations on rules and alerts.

**Key Operations:**

- Create/Update/Delete risk rules
- Create/Resolve alerts
- Query flagged transactions and merchants
- Support for archived alerts (soft delete)

### 3. Risk Controller (RiskController)

RESTful API endpoints for rule and alert management.

**Endpoints:**

- GET/POST/PATCH/DELETE `/api/v1/risk/rules`
- GET `/api/v1/risk/flagged-transactions`
- GET `/api/v1/risk/flagged-merchants`
- GET/POST `/api/v1/risk/alerts`

### 4. Permission Guard

RBAC implementation for `risk:manage` permission check.

```typescript
@Get('rules')
@Permission('risk:manage')
async getRules() { ... }
```

## Data Models

### RiskRule Entity

```typescript
{
  id: UUID (Primary Key),
  name: string,
  description: string,
  ruleType: enum (TRANSACTION_AMOUNT | TRANSACTION_VELOCITY | ...),
  conditions: JSONB (flexible condition structure),
  severity: enum (LOW | MEDIUM | HIGH | CRITICAL),
  isEnabled: boolean,
  autoBlock: boolean,
  createdById: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp (soft delete)
}
```

### RiskAlert Entity

```typescript
{
  id: UUID (Primary Key),
  severity: enum,
  type: string,
  message: string,
  affectedTransactionId: UUID (nullable),
  affectedMerchantId: UUID (nullable),
  triggeredRuleId: UUID (FK),
  status: enum (OPEN | RESOLVED),
  autoActionTaken: enum (NO_ACTION | SUSPENDED_MERCHANT | REJECTED_TRANSACTION),
  resolution: text (nullable, required for resolution),
  resolvedById: string,
  resolvedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Features Implementation

### 1. Auto-Blocking Rules

When `autoBlock: true`, rules automatically:

- Reject transactions: `autoActionTaken: REJECTED_TRANSACTION`
- Suspend merchants: `autoActionTaken: SUSPENDED_MERCHANT`

**Implementation:**

```typescript
if (rule.autoBlock && ruleTriggered) {
  alert.autoActionTaken =
    rule.ruleType === 'ADDRESS_BLACKLIST'
      ? 'REJECTED_TRANSACTION'
      : 'SUSPENDED_MERCHANT';
}
```

### 2. Alert Resolution

Required fields for alert resolution:

- `resolution`: Minimum 20 characters (business decision note)
- `action`: Resolution action type
- `resolvedById`: User who resolved the alert (captured from context)
- `resolvedAt`: Timestamp of resolution

**Example:**

```json
{
  "resolution": "Legitimate transaction verified with customer via phone call on 2026-02-20.",
  "action": "NO_ACTION"
}
```

### 3. Case-Insensitive Address Matching

ADDRESS_BLACKLIST rules normalize addresses to lowercase:

```typescript
private evaluateAddressBlacklist(
  conditions: RiskCondition,
  transactionData: TransactionData,
): boolean {
  const normalizedFromAddress = transactionData.fromAddress.toLowerCase();
  return conditions.addresses.some(
    (addr) => addr.toLowerCase() === normalizedFromAddress
  );
}
```

### 4. Soft Delete for Rules

Rules are soft-deleted (archived) and can be filtered:

```typescript
// Soft delete preserves audit trail
await this.riskRuleRepository.softRemove(rule);

// Query excludes soft-deleted by default
// Use withDeleted() to include archived rules
```

### 5. Alert Filtering

Alerts support status-based filtering:

```
GET /api/v1/risk/alerts?status=OPEN
GET /api/v1/risk/alerts?status=RESOLVED
```

## Testing Strategy

### Unit Tests

**RuleEvaluationService Tests:**

- ✅ Transaction amount evaluation (all comparison operators)
- ✅ Address blacklist (case-insensitive matching)
- ✅ Country block
- ✅ Transaction velocity
- ✅ Merchant volume
- ✅ Error handling

**RiskManagementService Tests:**

- ✅ CRUD operations on rules
- ✅ Alert creation and resolution
- ✅ Validation (e.g., minimum resolution length)
- ✅ Query operations (flagged transactions/merchants)

### Integration Tests

Example e2e test in `test/risk-monitoring.e2e.spec.ts`:

- Rule lifecycle (create → update → delete)
- Alert management (create → resolve)
- Permission-based access

**Run Tests:**

```bash
npm run test                 # Unit tests
npm run test:watch         # Watch mode
npm run test:cov           # Coverage report
```

## Setup and Deployment

### Development Setup

1. **Prerequisites:**
   - Node.js 18+
   - PostgreSQL 13+
   - Docker & Docker Compose (optional)

2. **Installation:**

   ```bash
   npm install
   ```

3. **Database Setup:**

   ```bash
   # Using Docker Compose
   docker-compose up -d

   # Or use existing PostgreSQL
   # Update .env with database credentials
   ```

4. **Environment Configuration:**

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Run Migrations:**

   ```bash
   npm run typeorm migration:run
   ```

6. **Start Development Server:**
   ```bash
   npm run start:dev
   ```

### Production Deployment

1. **Build Application:**

   ```bash
   npm run build
   ```

2. **Environment Setup:**

   ```bash
   export NODE_ENV=production
   export DB_HOST=prod-db-host
   # ... set other environment variables
   ```

3. **Run Migrations:**

   ```bash
   npm run typeorm migration:run -- -d dist/config/typeorm.config.js
   ```

4. **Start Application:**
   ```bash
   npm run start:prod
   ```

## API Examples

### Create a Risk Rule

```bash
curl -X POST http://localhost:3000/api/v1/risk/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "High Transaction Amount",
    "description": "Block transactions exceeding $50,000",
    "ruleType": "TRANSACTION_AMOUNT",
    "conditions": {
      "threshold": 50000,
      "currency": "USD",
      "comparison": "gt"
    },
    "severity": "HIGH",
    "autoBlock": true
  }'
```

### Get All Risk Rules

```bash
curl http://localhost:3000/api/v1/risk/rules?enabled=true \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create an Alert

```bash
# Typically created automatically when rule is triggered
# But can be created manually for testing:

curl -X POST http://localhost:3000/api/v1/risk/alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "triggeredRuleId": "rule-uuid",
    "severity": "HIGH",
    "type": "TRANSACTION_AMOUNT",
    "message": "Transaction exceeds threshold",
    "affectedTransactionId": "txn-uuid"
  }'
```

### Resolve an Alert

```bash
curl -X POST http://localhost:3000/api/v1/risk/alerts/alert-uuid/resolve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "resolution": "Legitimate transaction confirmed by customer service team.",
    "action": "NO_ACTION"
  }'
```

### Get Flagged Transactions

```bash
curl http://localhost:3000/api/v1/risk/flagged-transactions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Flagged Merchants

```bash
curl http://localhost:3000/api/v1/risk/flagged-merchants \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Performance Considerations

### Indexing Strategy

Entities are indexed on:

- **RiskRule**: (ruleType, isEnabled), createdById
- **RiskAlert**: (status, severity), affectedTransactionId, affectedMerchantId, triggeredRuleId

### Query Optimization

- Use `.select()` to retrieve only necessary fields
- Implement pagination for list endpoints
- Cache frequently accessed rules

### Database Connection Pooling

Configure in `.env`:

```
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
```

## Security Best Practices

1. **Input Validation**: All DTOs use class-validator
2. **SQL Injection Prevention**: TypeORM parameterized queries
3. **Authorization**: Permission guard for `risk:manage`
4. **Audit Trail**: Soft deletes preserve history
5. **Data Encryption**: Hash sensitive conditions if needed
6. **Rate Limiting**: Implement globally or per endpoint
7. **CORS**: Configure for production domains

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
npm run typeorm query "SELECT 1"

# Check migrations status
npm run typeorm migration:show
```

### Rule Not Triggering

1. Verify rule `isEnabled: true`
2. Check rule conditions match transaction data
3. Ensure transaction data is in correct format
4. Review rule evaluation logs

### Alert Resolution Fails

1. Verify alert status is OPEN
2. Check resolution length >= 20 characters
3. Ensure valid AlertActionType

## Future Enhancements

1. **Scheduled Rules**: Time-based rule evaluation
2. **Machine Learning**: Anomaly detection models
3. **Webhooks**: Real-time alert notifications
4. **Batch Processing**: Evaluate historical transactions
5. **Multi-tenant Support**: Separate rule sets per organization
6. **Advanced Analytics**: Dashboard with metrics and trends
7. **Custom Rule DSL**: Allow custom rule expressions
8. **Rule Versioning**: Track rule changes over time

## Support and Maintenance

- Regular security updates: `npm audit`
- Database backups: Daily via cron job
- Log aggregation: Centralize logs using ELK or similar
- Monitoring: Set up alerts for failed evaluations
