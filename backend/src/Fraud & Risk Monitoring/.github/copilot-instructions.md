<!-- Fraud & Risk Monitoring System - Copilot Instructions -->

# Workspace Guidelines

## Project Overview

Rule-based risk monitoring system built with NestJS that automatically detects suspicious transactions and merchants through configurable rules and real-time alerts.

## Project Structure

```
src/
├── modules/risk/              # Main feature module
│   ├── controllers/           # REST API endpoints
│   ├── services/              # Business logic
│   ├── entities/              # Database models
│   ├── dto/                   # Request/response validation
│   ├── enums/                 # Constants (rule types, severity, status)
│   ├── interfaces/            # TypeScript interfaces
│   └── tests/                 # Unit tests
├── common/guards/             # Permission-based access control
├── config/                    # Configuration (database, etc)
├── database/migrations/       # TypeORM database migrations
├── app.module.ts              # Root module
└── main.ts                    # Application entry point
```

## Key Technologies

- **Framework**: NestJS 10.x
- **Database**: PostgreSQL 13+ with TypeORM
- **Language**: TypeScript 5.x
- **Testing**: Jest with 60+ test cases
- **Container**: Docker & Docker Compose

## Development Commands

```bash
npm run start:dev          # Start development server
npm run test               # Run all tests
npm run test:watch        # Tests in watch mode
npm run test:cov          # Coverage report
npm run build              # Build for production
npm run start:prod        # Start production build
npm run lint              # Run ESLint
npm run format            # Format code with Prettier
```

## API Endpoints

- `GET/POST/PATCH/DELETE /api/v1/risk/rules` - Rule management
- `GET /api/v1/risk/flagged-transactions` - View flagged transactions
- `GET /api/v1/risk/flagged-merchants` - View flagged merchants
- `GET/POST /api/v1/risk/alerts` - Alert management

## Important Files

- `QUICK_START.md` - 5-minute setup guide
- `README.md` - Complete API documentation
- `IMPLEMENTATION_GUIDE.md` - Architecture and design patterns
- `PROJECT_COMPLETE.md` - Project summary and statistics

## Database Configuration

```
Default: PostgreSQL on localhost:5432
Username: postgres
Password: password
Database: fraud_risk_monitoring
```

Use `docker-compose up -d` to start database with Docker.

## Code Standards

- **Language**: TypeScript (strict mode enabled)
- **Linting**: ESLint with @typescript-eslint
- **Formatting**: Prettier (2-space indent)
- **Testing**: Jest with comprehensive coverage
- **Validation**: class-validator for DTO validation

## Rule Types Supported

1. **TRANSACTION_AMOUNT** - Threshold-based detection
2. **TRANSACTION_VELOCITY** - Rapid transaction patterns
3. **MERCHANT_VOLUME** - High-volume detection
4. **ADDRESS_BLACKLIST** - Blocked addresses (case-insensitive)
5. **COUNTRY_BLOCK** - Geographic blocking

## Key Features

- ✅ Automatic alert creation on rule trigger
- ✅ Auto-blocking with merchant suspension or transaction rejection
- ✅ Alert resolution with 20+ character audit trail
- ✅ Soft delete for rule archiving
- ✅ Permission-based access control (risk:manage)
- ✅ Case-insensitive address matching
- ✅ Status filtering for alerts (OPEN/RESOLVED)

## Testing

- **Unit Tests**: 60+ test cases in `src/modules/risk/tests/`
- **Coverage**: All critical paths tested
- **E2E Template**: `test/risk-monitoring.e2e.spec.ts`

## Quick Test

```bash
npm run test -- rule-evaluation.service.spec
npm run test -- risk-management.service.spec
npm run test:cov
```

## Common Tasks

### Create Risk Rule

```typescript
const rule = await riskManagementService.createRule(
  {
    name: 'High Amount',
    description: 'Block high transactions',
    ruleType: 'TRANSACTION_AMOUNT',
    conditions: { threshold: 50000, currency: 'USD', comparison: 'gt' },
    severity: 'HIGH',
    autoBlock: true,
  },
  'userId',
);
```

### Resolve Alert

```typescript
await riskManagementService.resolveAlert(
  'alertId',
  {
    resolution: 'Legitimate transaction verified by customer.',
    action: 'NO_ACTION',
  },
  'userId',
);
```

## Debugging

- **Enable TypeORM logging**: Set `logging: true` in typeorm.config.ts
- **Check database**: Use PgAdmin at http://localhost:5050
- **View application logs**: Check terminal output
- **Debug tests**: Use `npm run test:debug`

## Performance Tips

- Use query filters: `?status=OPEN`, `?enabled=true`
- Index queries on frequently filtered columns
- Cache rule configurations in memory
- Implement pagination for large datasets

## Security

- Permission-based authorization via `@Permission('risk:manage')`
- SQL injection prevention via TypeORM ORM
- Input validation using class-validator
- Soft delete audit trail preserved

## Deployment

1. Build: `npm run build`
2. Run migrations: `npm run typeorm migration:run`
3. Start: `npm run start:prod`

## Common Issues

**Port already in use**

```bash
# Change in .env
PORT=3001
```

**Database connection failed**

```bash
# Restart database
docker-compose restart
# Check status
docker-compose logs postgres
```

**Tests failing**

```bash
# Clear Jest cache
npm run test -- --clearCache
```

## Reference Documentation

- NestJS: https://docs.nestjs.com
- TypeORM: https://typeorm.io
- Jest: https://jestjs.io
- TypeScript: https://www.typescriptlang.org

## Contact Points

1. Check documentation files (README, QUICK_START, IMPLEMENTATION_GUIDE)
2. Review test files for implementation examples
3. Check error logs and stack traces
4. Verify database migrations were run

---

**Last Updated**: February 20, 2026
**Status**: Production Ready ✅
