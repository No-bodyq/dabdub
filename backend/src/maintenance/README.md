# Maintenance Window System

A comprehensive system for scheduling and managing planned maintenance windows with automatic notifications and service blocking.

## Features

✅ **MaintenanceWindow Entity**: Complete database model with status tracking  
✅ **Cached Service Methods**: Redis-cached `getUpcoming()` and `getActive()` methods  
✅ **Smart Middleware**: Blocks affected services during maintenance, admin bypass  
✅ **BullMQ Scheduling**: Automatic start/end jobs with advance notifications  
✅ **WebSocket Notifications**: Real-time maintenance start/end broadcasts  
✅ **Email & Push Notifications**: 24h and 1h advance user notifications  
✅ **Admin API**: Full CRUD operations for maintenance windows  
✅ **Public API**: Client access to upcoming/active maintenance info  
✅ **Unit Tests**: Comprehensive test coverage  

## API Endpoints

### Public
- `GET /api/v1/system/maintenance` - Get upcoming and active maintenance windows

### Admin (SuperAdmin only)
- `POST /api/v1/admin/maintenance` - Schedule new maintenance window
- `PATCH /api/v1/admin/maintenance/:id/cancel` - Cancel scheduled window
- `GET /api/v1/admin/maintenance` - List all maintenance windows
- `GET /api/v1/admin/maintenance/:id` - Get maintenance window details

## Database Schema

```sql
CREATE TABLE maintenance_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  "startAt" TIMESTAMP NOT NULL,
  "endAt" TIMESTAMP NOT NULL,
  "affectedServices" TEXT[] NOT NULL,
  status maintenance_status DEFAULT 'scheduled',
  "createdBy" UUID NOT NULL REFERENCES admins(id),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE maintenance_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
```

## Service Mapping

The middleware maps route prefixes to service names:

- `/api/v1/transfers` → `transfers`
- `/api/v1/withdrawals` → `withdrawals`  
- `/api/v1/bank-accounts` → `banking`
- `/api/v1/virtual-cards` → `cards`
- `/api/v1/paylink` → `paylinks`
- `/api/v1/merchants` → `merchants`
- `/api/v1/wallets` → `wallets`
- `/api/v1/auth` → `auth`

Use `"all"` in `affectedServices` to block all routes.

## Caching Strategy

- **Upcoming windows**: 5-minute TTL (less frequent changes)
- **Active windows**: 30-second TTL (needs to be current)
- Cache keys: `maintenance:upcoming`, `maintenance:active`

## WebSocket Events

- `system_maintenance_start` - Broadcast when maintenance begins
- `system_maintenance_end` - Broadcast when maintenance completes

## Notifications

- **24 hours before**: Email + push notification to all active users
- **1 hour before**: Email + push notification to all active users
- **Real-time**: WebSocket broadcasts for start/end events

## Error Response Format

When a request is blocked during maintenance:

```json
{
  "statusCode": 503,
  "message": {
    "code": "MAINTENANCE",
    "message": "System Upgrade",
    "description": "We are upgrading our payment processing system...",
    "estimatedRestoration": "2024-03-30T06:00:00Z",
    "affectedServices": ["transfers", "withdrawals"]
  }
}
```

## Usage Examples

### Schedule Maintenance
```typescript
POST /api/v1/admin/maintenance
{
  "title": "Payment System Upgrade",
  "description": "Upgrading payment processing for improved reliability",
  "startAt": "2024-03-30T02:00:00Z",
  "endAt": "2024-03-30T06:00:00Z", 
  "affectedServices": ["transfers", "withdrawals"]
}
```

### Cancel Maintenance
```typescript
PATCH /api/v1/admin/maintenance/uuid/cancel
```

### Check Active Maintenance
```typescript
GET /api/v1/system/maintenance
```

## Testing

Run the test suite:
```bash
npm test -- maintenance
```

Tests cover:
- Service methods with caching
- Middleware blocking logic
- Admin bypass functionality
- Service mapping accuracy
- Error response format