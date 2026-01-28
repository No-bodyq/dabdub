# Analytics Module

Comprehensive analytics and reporting system for merchant metrics, dashboard data, and business intelligence.

## Features

- **Dashboard Metrics**: Real-time overview with period comparisons
- **Revenue Analytics**: Time-series revenue data with growth tracking
- **Transaction Trends**: Success rates and volume trends
- **Settlement Statistics**: Settlement performance and timing
- **Network Usage**: Multi-chain blockchain analytics
- **Performance Metrics**: System performance and success rates
- **Customer Insights**: Customer behavior and top customers
- **Report Generation**: Async report generation in multiple formats

## Endpoints

### Base URL: `/api/v1/analytics`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dashboard` | GET | Dashboard overview metrics |
| `/revenue` | GET | Revenue data with intervals |
| `/transactions/trends` | GET | Transaction trends |
| `/settlements/statistics` | GET | Settlement statistics |
| `/networks/usage` | GET | Network usage stats |
| `/performance` | GET | Performance metrics |
| `/customers/insights` | GET | Customer analytics |
| `/reports/generate` | POST | Generate report |
| `/reports/:id/download` | GET | Download report |

## Quick Start

```typescript
// Get dashboard metrics
const metrics = await analyticsService.getDashboardMetrics(
  merchantId,
  startDate,
  endDate
);

// Get revenue data
const revenue = await analyticsService.getRevenueData(
  merchantId,
  startDate,
  endDate,
  TimeInterval.DAY
);
```

## Performance

- **Caching**: 10-minute Redis cache
- **Query Optimization**: Parallel execution, raw queries
- **Load Time**: Dashboard < 2 seconds
- **Scalability**: Handles millions of transactions

## Testing

```bash
# Unit tests
npm test -- analytics.controller.spec.ts

# E2E tests
npm run test:e2e -- analytics.e2e-spec.ts
```

## Documentation

Full API documentation available at `/api/docs` when server is running.
