import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceWebhookMonitoring1737989233000 implements MigrationInterface {
  name = 'EnhanceWebhookMonitoring1737989233000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add indexes for better query performance on webhook delivery logs
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_webhook_delivery_logs_status_created_at" 
      ON "webhook_delivery_logs" ("status", "created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_webhook_delivery_logs_webhook_status_created" 
      ON "webhook_delivery_logs" ("webhook_config_id", "status", "created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_webhook_delivery_logs_event_created_at" 
      ON "webhook_delivery_logs" ("event", "created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_webhook_delivery_logs_response_time" 
      ON "webhook_delivery_logs" ("response_time_ms") 
      WHERE "response_time_ms" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_webhook_delivery_logs_next_retry_at" 
      ON "webhook_delivery_logs" ("next_retry_at") 
      WHERE "next_retry_at" IS NOT NULL;
    `);

    // Add indexes for webhook configurations
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_webhook_configurations_merchant_active" 
      ON "webhook_configurations" ("merchant_id", "is_active");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_webhook_configurations_status_active" 
      ON "webhook_configurations" ("status", "is_active");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_webhook_configurations_consecutive_failures" 
      ON "webhook_configurations" ("consecutive_failures") 
      WHERE "consecutive_failures" > 0;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_webhook_configurations_last_delivered_at" 
      ON "webhook_configurations" ("last_delivered_at") 
      WHERE "last_delivered_at" IS NOT NULL;
    `);

    // Add partial indexes for better performance on common queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_webhook_delivery_logs_failed_recent" 
      ON "webhook_delivery_logs" ("webhook_config_id", "created_at") 
      WHERE "status" = 'failed' AND "created_at" > NOW() - INTERVAL '7 days';
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_webhook_delivery_logs_delivered_recent" 
      ON "webhook_delivery_logs" ("webhook_config_id", "created_at", "response_time_ms") 
      WHERE "status" = 'delivered' AND "created_at" > NOW() - INTERVAL '30 days';
    `);

    // Create a view for webhook health metrics (optional, for complex queries)
    await queryRunner.query(`
      CREATE OR REPLACE VIEW "webhook_health_metrics" AS
      SELECT 
        wc.id as webhook_id,
        wc.merchant_id,
        wc.url,
        wc.status,
        wc.is_active,
        wc.consecutive_failures,
        wc.last_delivered_at,
        wc.last_failure_at,
        
        -- 24h metrics
        COUNT(CASE WHEN wdl.created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as deliveries_24h,
        COUNT(CASE WHEN wdl.created_at > NOW() - INTERVAL '24 hours' AND wdl.status = 'delivered' THEN 1 END) as successful_24h,
        COUNT(CASE WHEN wdl.created_at > NOW() - INTERVAL '24 hours' AND wdl.status = 'failed' THEN 1 END) as failed_24h,
        
        -- Response time metrics (24h)
        AVG(CASE WHEN wdl.created_at > NOW() - INTERVAL '24 hours' AND wdl.response_time_ms IS NOT NULL THEN wdl.response_time_ms END) as avg_response_time_24h,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY wdl.response_time_ms) FILTER (WHERE wdl.created_at > NOW() - INTERVAL '24 hours' AND wdl.response_time_ms IS NOT NULL) as p95_response_time_24h,
        
        -- 7d metrics
        COUNT(CASE WHEN wdl.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as deliveries_7d,
        COUNT(CASE WHEN wdl.created_at > NOW() - INTERVAL '7 days' AND wdl.status = 'delivered' THEN 1 END) as successful_7d,
        COUNT(CASE WHEN wdl.created_at > NOW() - INTERVAL '7 days' AND wdl.status = 'failed' THEN 1 END) as failed_7d,
        
        -- Success rates
        CASE 
          WHEN COUNT(CASE WHEN wdl.created_at > NOW() - INTERVAL '24 hours' THEN 1 END) > 0 
          THEN (COUNT(CASE WHEN wdl.created_at > NOW() - INTERVAL '24 hours' AND wdl.status = 'delivered' THEN 1 END)::float / COUNT(CASE WHEN wdl.created_at > NOW() - INTERVAL '24 hours' THEN 1 END)::float) * 100
          ELSE 100
        END as success_rate_24h,
        
        CASE 
          WHEN COUNT(CASE WHEN wdl.created_at > NOW() - INTERVAL '7 days' THEN 1 END) > 0 
          THEN (COUNT(CASE WHEN wdl.created_at > NOW() - INTERVAL '7 days' AND wdl.status = 'delivered' THEN 1 END)::float / COUNT(CASE WHEN wdl.created_at > NOW() - INTERVAL '7 days' THEN 1 END)::float) * 100
          ELSE 100
        END as success_rate_7d
        
      FROM webhook_configurations wc
      LEFT JOIN webhook_delivery_logs wdl ON wc.id = wdl.webhook_config_id
      GROUP BY wc.id, wc.merchant_id, wc.url, wc.status, wc.is_active, wc.consecutive_failures, wc.last_delivered_at, wc.last_failure_at;
    `);

    // Add a function to calculate webhook health status
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION calculate_webhook_health_status(
        is_active boolean,
        success_rate_24h numeric,
        consecutive_failures integer
      ) RETURNS text AS $$
      BEGIN
        IF NOT is_active THEN
          RETURN 'disabled';
        ELSIF success_rate_24h >= 95 AND consecutive_failures < 3 THEN
          RETURN 'healthy';
        ELSIF success_rate_24h >= 85 AND consecutive_failures < 5 THEN
          RETURN 'degraded';
        ELSE
          RETURN 'unhealthy';
        END IF;
      END;
      $$ LANGUAGE plpgsql IMMUTABLE;
    `);

    // Create an enhanced view with health status
    await queryRunner.query(`
      CREATE OR REPLACE VIEW "webhook_health_status" AS
      SELECT 
        *,
        calculate_webhook_health_status(is_active, success_rate_24h, consecutive_failures) as health_status
      FROM webhook_health_metrics;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop views and functions
    await queryRunner.query(`DROP VIEW IF EXISTS "webhook_health_status";`);
    await queryRunner.query(`DROP VIEW IF EXISTS "webhook_health_metrics";`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS calculate_webhook_health_status(boolean, numeric, integer);`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_delivery_logs_status_created_at";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_delivery_logs_webhook_status_created";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_delivery_logs_event_created_at";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_delivery_logs_response_time";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_delivery_logs_next_retry_at";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_configurations_merchant_active";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_configurations_status_active";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_configurations_consecutive_failures";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_configurations_last_delivered_at";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_delivery_logs_failed_recent";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_delivery_logs_delivered_recent";`);
  }
}