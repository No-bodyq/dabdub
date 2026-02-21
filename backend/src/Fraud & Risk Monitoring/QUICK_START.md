# Quick Start Guide

## 5-Minute Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Start Database (Using Docker)

```bash
docker-compose up -d
```

This starts:

- PostgreSQL (port 5432)
- PgAdmin (port 5050) - Web interface at http://localhost:5050

### Step 3: Configure Environment

```bash
cp .env.example .env
# Default values are pre-configured for local development
```

### Step 4: Start Development Server

```bash
npm run start:dev
```

The API will be available at: **http://localhost:3000**

## First Test

### Test the API

```bash
curl http://localhost:3000/api/v1/risk/rules \
  -H "Authorization: Bearer test-token"
```

## Run Tests

```bash
# Unit tests
npm run test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:cov
```

## Project Structure at a Glance

```
src/
├── modules/risk/           # Main feature module
│   ├── controllers/        # API endpoints (/api/v1/risk/*)
│   ├── services/           # Business logic (rules, alerts)
│   ├── entities/           # Database models
│   ├── dto/                # Request/response validation
│   ├── enums/              # Rule types, severity, status
│   ├── tests/              # Unit tests
│   └── risk.module.ts      # Module configuration
├── common/                 # Shared utilities
│   └── guards/             # Permission-based access control
├── config/                 # Configuration
│   └── typeorm.config.ts   # Database settings
├── database/               # Database layer
│   └── migrations/         # Schema migrations
├── app.module.ts           # Root module
└── main.ts                 # Entry point
```

## Key Features Implemented

✅ **Rule Types:**

- TRANSACTION_AMOUNT - Threshold-based detection
- TRANSACTION_VELOCITY - Rapid transaction patterns
- MERCHANT_VOLUME - High-volume merchants
- ADDRESS_BLACKLIST - Blocked addresses (case-insensitive)
- COUNTRY_BLOCK - Geolocation-based blocking

✅ **Alert Management:**

- Automatic alert creation on rule trigger
- Manual alert resolution with audit trail
- Severity-based filtering
- Status tracking (OPEN/RESOLVED)

✅ **Auto-Blocking:**

- Automatic merchant suspension
- Transaction rejection
- Configurable per rule

✅ **Testing:**

- 40+ unit test cases
- All rule types covered
- Edge case handling

## API Endpoints Overview

| Method | Endpoint                            | Purpose                   |
| ------ | ----------------------------------- | ------------------------- |
| GET    | `/api/v1/risk/rules`                | List all rules            |
| POST   | `/api/v1/risk/rules`                | Create new rule           |
| PATCH  | `/api/v1/risk/rules/:id`            | Update rule               |
| DELETE | `/api/v1/risk/rules/:id`            | Delete rule               |
| GET    | `/api/v1/risk/flagged-transactions` | View flagged transactions |
| GET    | `/api/v1/risk/flagged-merchants`    | View flagged merchants    |
| GET    | `/api/v1/risk/alerts`               | List alerts               |
| POST   | `/api/v1/risk/alerts/:id/resolve`   | Resolve alert             |

## Example: Create a Risk Rule

```bash
curl -X POST http://localhost:3000/api/v1/risk/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Prevent High Transactions",
    "description": "Block transactions over 50k USD",
    "ruleType": "TRANSACTION_AMOUNT",
    "conditions": {
      "threshold": 50000,
      "currency": "USD",
      "comparison": "gt"
    },
    "severity": "HIGH",
    "autoBlock": true,
    "isEnabled": true
  }'
```

## Example: Resolve an Alert

```bash
curl -X POST http://localhost:3000/api/v1/risk/alerts/ALERT_ID/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "Verified legitimate transaction with customer via phone confirmation.",
    "action": "NO_ACTION"
  }'
```

## Troubleshooting

### Port Already in Use

```bash
# Change port in .env
PORT=3001
npm run start:dev
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart containers
docker-compose restart
```

### Tests Failing

```bash
# Clear Jest cache
npm run test -- --clearCache

# Run specific test
npm run test -- rule-evaluation.service.spec
```

## Next Steps

1. **Read IMPLEMENTATION_GUIDE.md** for detailed architecture
2. **Check README.md** for complete API documentation
3. **Review test files** for usage examples:
   - `src/modules/risk/tests/rule-evaluation.service.spec.ts`
   - `src/modules/risk/tests/risk-management.service.spec.ts`

## Database Administration

### Access PgAdmin

- URL: http://localhost:5050
- Email: admin@example.com
- Password: admin

### View Logs

```bash
# Application logs
npm run start:dev

# Database logs
docker-compose logs postgres
```

## Development Commands

```bash
# Start development server
npm run start:dev

# Format code
npm run format

# Lint code
npm run lint

# Build for production
npm run build

# Start production build
npm run start:prod

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov
```

## File Organization

- **Entities**: Define database schema
- **DTOs**: Validate and transform API requests
- **Services**: Core business logic
- **Controllers**: Handle HTTP requests
- **Guards**: Implement authorization
- **Enums**: Type-safe constants
- **Tests**: Comprehensive test coverage

## Acceptance Criteria Status

- ✅ Auto-blocking rules trigger merchant suspension or transaction rejection
- ✅ Alert resolution requires minimum 20-character resolution note
- ✅ Resolved alerts tracked with status=RESOLVED
- ✅ Address blacklist matching is case-insensitive
- ✅ Unit tests for each RiskRuleType evaluation logic
- ✅ CRUD endpoints for rule management
- ✅ Alert filtering by status
- ✅ Permission-based access control

## Performance Tips

1. Use query parameters to filter:
   - `GET /api/v1/risk/alerts?status=OPEN`
   - `GET /api/v1/risk/rules?enabled=true`

2. Implement pagination for large datasets (future enhancement)

3. Cache frequently accessed rules in memory

## Support

For detailed information, see:

- **README.md** - API documentation and features
- **IMPLEMENTATION_GUIDE.md** - Architecture and design patterns
- **Test files** - Implementation examples
