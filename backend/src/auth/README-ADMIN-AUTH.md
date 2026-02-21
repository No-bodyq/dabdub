# Admin JWT Authentication Strategy

This document describes the implementation of the Admin JWT Authentication Strategy for secure admin access to the application.

## Overview

The Admin JWT Authentication Strategy provides a separate authentication flow for admin users with enhanced security features:

- **Separate JWT tokens** with admin-specific claims
- **Short-lived access tokens** (2 hours by default)
- **Role-based access control** (ADMIN, SUPPORT_ADMIN)
- **Brute-force protection** with account lockout
- **Rate limiting** on admin endpoints
- **Comprehensive audit logging**

## Architecture

### Components

1. **AdminJwtStrategy** - Passport strategy for validating admin JWT tokens
2. **AdminJwtGuard** - Guard for protecting admin endpoints
3. **AdminAuthService** - Service handling admin authentication logic
4. **AdminAuthController** - Controller exposing admin auth endpoints
5. **AdminRateLimitMiddleware** - Rate limiting for admin endpoints
6. **Database Entities** - Admin sessions and login attempt tracking

### Database Schema

```sql
-- Admin sessions for refresh token management
CREATE TABLE admin_sessions (
  id VARCHAR PRIMARY KEY,
  refreshToken TEXT NOT NULL,
  userAgent TEXT,
  ipAddress VARCHAR(45),
  expiresAt TIMESTAMP NOT NULL,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  userId VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Admin login attempt tracking for brute-force protection
CREATE TABLE admin_login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  ipAddress VARCHAR(45) NOT NULL,
  userAgent TEXT,
  successful BOOLEAN DEFAULT false,
  failureReason VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### POST /admin/auth/login

Authenticates admin users and returns JWT tokens.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "SecureAdminPass123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 7200,
  "admin": {
    "id": "user_123",
    "email": "admin@example.com",
    "role": "ADMIN"
  },
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Security Features:**
- Only users with `ADMIN` or `SUPPORT_ADMIN` roles can login
- Account lockout after 5 failed attempts within 10 minutes
- Lockout duration: 30 minutes
- All attempts are logged with IP address and user agent

### POST /admin/auth/refresh

Refreshes admin access tokens using a valid refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 7200,
  "admin": {
    "id": "user_123",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

### POST /admin/auth/logout

Invalidates the admin refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

## JWT Token Structure

### Access Token Payload
```json
{
  "sub": "user_123",
  "email": "admin@example.com",
  "role": "ADMIN",
  "type": "admin",
  "iat": 1708444800,
  "exp": 1708452000
}
```

### Refresh Token Payload
```json
{
  "sub": "user_123",
  "type": "admin_refresh",
  "iat": 1708444800,
  "exp": 1709049600
}
```

## Security Features

### 1. Token Validation
- Tokens must have `type: "admin"` claim
- User role must be `ADMIN` or `SUPPORT_ADMIN`
- User must be active in the database
- Double-check role in database vs. token claim

### 2. Brute-Force Protection
- Track failed login attempts per email/IP
- Lock account after 5 failed attempts in 10 minutes
- Lockout duration: 30 minutes
- Alert logging for security monitoring

### 3. Rate Limiting
- Max 20 requests per minute per IP on admin endpoints
- Applied to all `/admin/*` routes
- Automatic cleanup of expired rate limit entries

### 4. Audit Logging
- All login attempts (successful and failed)
- Account lockouts with detailed information
- Token refresh events
- Logout events

## Configuration

### Environment Variables

```bash
# Admin JWT token expiration (default: 2h)
ADMIN_JWT_EXPIRES_IN=2h

# JWT secret (shared with regular JWT)
JWT_SECRET=your-secret-key
```

### Supported Time Formats
- `s` - seconds (e.g., `3600s`)
- `m` - minutes (e.g., `120m`)
- `h` - hours (e.g., `2h`)
- `d` - days (e.g., `1d`)

## Usage Examples

### 1. Protecting Admin Endpoints

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';

@Controller('admin/dashboard')
@UseGuards(AdminJwtGuard)
export class AdminDashboardController {
  @Get()
  async getDashboard(@Request() req: any) {
    // req.user contains the authenticated admin user
    return { admin: req.user.email };
  }
}
```

### 2. Permission-Based Access Control

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { RequirePermissionGuard } from '../auth/guards/require-permission.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('admin/analytics')
@UseGuards(AdminJwtGuard)
export class AdminAnalyticsController {
  
  // Accessible by both ADMIN and SUPPORT_ADMIN
  @Get('general')
  @UseGuards(RequirePermissionGuard)
  @RequirePermission('analytics:read')
  async getGeneralAnalytics() {
    return { stats: 'general analytics' };
  }

  // Only accessible by ADMIN (SUPPORT_ADMIN is restricted)
  @Get('revenue')
  @UseGuards(RequirePermissionGuard)
  @RequirePermission('analytics:revenue')
  async getRevenueAnalytics() {
    return { revenue: 'sensitive data' };
  }
}
```

### 3. Client-Side Usage

```javascript
// Login
const loginResponse = await fetch('/admin/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'password'
  })
});

const { access_token, refresh_token } = await loginResponse.json();

// Use access token for API calls
const apiResponse = await fetch('/admin/dashboard', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

// Refresh token when needed
const refreshResponse = await fetch('/admin/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh_token })
});
```

## Role Permissions

### ADMIN Role
- Full access to all admin endpoints
- Can access revenue analytics (`analytics:revenue`)
- Can access general analytics (`analytics:read`)

### SUPPORT_ADMIN Role
- Limited admin access
- **Cannot** access revenue analytics (`analytics:revenue`)
- Can access general analytics (`analytics:read`)

## Testing

### Unit Tests
- `AdminAuthService` - Authentication logic
- `AdminJwtStrategy` - Token validation
- All test files include success and failure scenarios

### E2E Tests
- Complete authentication flow
- Rate limiting verification
- Brute-force protection testing
- Role-based access control

### Running Tests
```bash
# Unit tests
npm run test auth/services/admin-auth.service.spec.ts
npm run test auth/strategies/admin-jwt.strategy.spec.ts

# E2E tests
npm run test:e2e admin-auth.e2e-spec.ts
```

## Migration

To set up the admin authentication system:

1. **Run the migration:**
   ```bash
   npm run migration:run
   ```

2. **Create admin users:**
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
   UPDATE users SET role = 'SUPPORT_ADMIN' WHERE email = 'support@example.com';
   ```

3. **Configure environment variables:**
   ```bash
   ADMIN_JWT_EXPIRES_IN=2h
   ```

4. **Update your admin frontend to use the new endpoints**

## Security Considerations

1. **Token Storage**: Store refresh tokens securely (httpOnly cookies recommended)
2. **HTTPS Only**: Always use HTTPS in production
3. **Token Rotation**: Implement refresh token rotation for enhanced security
4. **Monitoring**: Monitor failed login attempts and account lockouts
5. **Regular Audits**: Review admin access logs regularly
6. **Principle of Least Privilege**: Use SUPPORT_ADMIN role for non-financial operations

## Troubleshooting

### Common Issues

1. **401 Unauthorized on admin endpoints**
   - Check if token has `type: "admin"` claim
   - Verify user role is ADMIN or SUPPORT_ADMIN
   - Ensure user is active in database

2. **403 Forbidden for SUPPORT_ADMIN**
   - Check if endpoint requires `analytics:revenue` permission
   - SUPPORT_ADMIN cannot access revenue-related endpoints

3. **Account locked after failed attempts**
   - Wait 30 minutes or manually clear `admin_login_attempts` table
   - Check for correct password and email

4. **Rate limiting errors**
   - Reduce request frequency to max 20/minute per IP
   - Check if multiple users share the same IP

## Future Enhancements

1. **Multi-Factor Authentication** for admin accounts
2. **IP Whitelisting** for admin access
3. **Session Management** with active session listing
4. **Advanced Audit Logging** with detailed action tracking
5. **Refresh Token Rotation** for enhanced security