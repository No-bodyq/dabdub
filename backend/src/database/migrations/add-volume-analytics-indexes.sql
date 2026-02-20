-- Migration: Add indexes for volume analytics query performance
-- Issue #151 — required for 500ms acceptance criterion on 1-year daily granularity

-- Primary index for date range queries on payment_requests
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_requests_created_at
    ON payment_requests (created_at DESC);

-- Composite index for merchant + date filtering (most common query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_requests_merchant_created
    ON payment_requests (merchant_id, created_at DESC);

-- Index for network/chain groupBy queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_requests_network_created
    ON payment_requests (stellar_network, created_at DESC);

-- Index for currency/token groupBy queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_requests_currency_created
    ON payment_requests (currency, created_at DESC);

-- Index for status filtering (success/failed counts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_requests_status_created
    ON payment_requests (status, created_at DESC);
