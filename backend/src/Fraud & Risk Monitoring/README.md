# Fraud & Risk Monitoring System

A rule-based risk monitoring system built with NestJS that automatically flags suspicious transactions and merchants. Admins can configure rules, manage alerts, and monitor risk in real-time.

## Features

- **Rule Engine**: Evaluate transactions against multiple rule types:
  - Transaction Amount Thresholds
  - Transaction Velocity Monitoring
  - Merchant Volume Tracking
  - Address Blacklisting (case-insensitive)
  - Country Blocking
- **Alert Management**: Create, view, and resolve alerts with detailed audit trails
- **Auto-Blocking**: Rules can automatically suspend merchants or reject transactions
- **Permission-Based Access Control**: RBAC with risk:manage permission
- **Comprehensive Testing**: Unit tests for all rule evaluation logic
- **RESTful API**: Full REST API for rule and alert management

## Project Structure

```
src/
├── config/                 # Configuration files
│   └── typeorm.config.ts  # Database configuration
├── common/                 # Shared utilities
│   ├── enums/             # Shared enums
│   ├── guards/            # Permission guards
│   └── interfaces/        # Shared interfaces
├── modules/
│   └── risk/              # Risk monitoring module
│       ├── controllers/   # API endpoints
│       ├── services/      # Business logic
│       ├── entities/      # Database entities
│       ├── dto/           # Data transfer objects
│       ├── enums/         # Risk-specific enums
│       ├── interfaces/    # Risk-specific interfaces
│       └── tests/         # Unit tests
├── database/              # Database migrations
├── app.module.ts          # Root module
└── main.ts               # Application entry point
```

## Installation

```bash
# Install dependencies
npm install

# Configure database
# Create a .env file in the root directory:
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=fraud_risk_monitoring
NODE_ENV=development
PORT=3000
```

## Running the Application

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

## Running Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

## API Endpoints

### Risk Rules Management

- `GET /api/v1/risk/rules` - List all risk rules
- `GET /api/v1/risk/rules/:id` - Get a specific rule
- `POST /api/v1/risk/rules` - Create a new rule
- `PATCH /api/v1/risk/rules/:id` - Update a rule
- `DELETE /api/v1/risk/rules/:id` - Delete (soft) a rule

### Risk Monitoring

- `GET /api/v1/risk/flagged-transactions` - Get flagged transactions
- `GET /api/v1/risk/flagged-merchants` - Get flagged merchants
- `GET /api/v1/risk/alerts` - Get alerts (supports ?status=OPEN|RESOLVED filter)
- `GET /api/v1/risk/alerts/:id` - Get a specific alert

### Alert Resolution

- `POST /api/v1/risk/alerts/:id/resolve` - Resolve an alert

## Example Requests

### Create a Risk Rule

```bash
POST /api/v1/risk/rules
Content-Type: application/json

{
  "name": "High Transaction Amount",
  "description": "Block transactions exceeding $50,000 USD",
  "ruleType": "TRANSACTION_AMOUNT",
  "conditions": {
    "threshold": 50000,
    "currency": "USD",
    "comparison": "gt"
  },
  "severity": "HIGH",
  "autoBlock": true,
  "isEnabled": true
}
```

### Resolve an Alert

```bash
POST /api/v1/risk/alerts/alert-uuid-here/resolve
Content-Type: application/json

{
  "resolution": "Legitimate transaction verified by customer support call.",
  "action": "NO_ACTION"
}
```

## Rule Types

### TRANSACTION_AMOUNT

Triggers when a transaction amount meets a comparison threshold.

**Conditions**:

- `threshold`: Amount threshold (default: 50000)
- `currency`: Currency code (default: USD)
- `comparison`: Comparison operator (gt, gte, lt, lte, eq)

### TRANSACTION_VELOCITY

Triggers when transaction count exceeds threshold in time window.

**Conditions**:

- `transactionCount`: Threshold count (default: 100)
- `window`: Time window (1h, 24h, 7d, etc.)

### MERCHANT_VOLUME

Triggers when merchant total volume exceeds threshold.

**Conditions**:

- `volumeThreshold`: Volume threshold (default: 1000000)
- `timeWindow`: Time window

### ADDRESS_BLACKLIST

Triggers when transaction source address is in blacklist (case-insensitive).

**Conditions**:

- `addresses`: Array of blacklisted addresses

### COUNTRY_BLOCK

Triggers when transaction source country is in block list.

**Conditions**:

- `countries`: Array of blocked country codes

## Alert Statuses

- `OPEN`: Alert created and awaiting resolution
- `RESOLVED`: Alert has been resolved with action

## Alert Actions

- `NO_ACTION`: No action taken, false positive
- `SUSPENDED_MERCHANT`: Merchant account suspended
- `REJECTED_TRANSACTION`: Transaction was rejected

## Testing

The system includes comprehensive unit tests for:

- All RiskRuleType evaluations (TRANSACTION_AMOUNT, ADDRESS_BLACKLIST, COUNTRY_BLOCK, TRANSACTION_VELOCITY, MERCHANT_VOLUME)
- Case-insensitive address matching
- Comparison operators (gt, gte, lt, lte, eq)
- Alert creation and resolution
- Permission-based access control
- Error handling

Run tests with `npm run test` or `npm run test:cov` for coverage reports.

## Security Features

- Soft delete for rules (audit trail)
- Permission-based access control (risk:manage)
- Input validation using class-validator
- SQL injection prevention via TypeORM ORM
- Role-based authorization

## License

UNLICENSED
