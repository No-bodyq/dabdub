import { MigrationInterface, QueryRunner } from 'typeorm';

export class TransactionDetailEnhancements1769342977095 implements MigrationInterface {
    name = 'TransactionDetailEnhancements1769342977095';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to the transactions table
        await queryRunner.query(`
      ALTER TABLE "transactions"
        ADD COLUMN IF NOT EXISTS "token_address" varchar(100),
        ADD COLUMN IF NOT EXISTS "token_symbol" varchar(20),
        ADD COLUMN IF NOT EXISTS "gas_used" varchar(50),
        ADD COLUMN IF NOT EXISTS "gas_price_gwei" varchar(50),
        ADD COLUMN IF NOT EXISTS "network_fee_eth" varchar(50),
        ADD COLUMN IF NOT EXISTS "network_fee_usd" decimal(18, 8),
        ADD COLUMN IF NOT EXISTS "exchange_rate" decimal(18, 8),
        ADD COLUMN IF NOT EXISTS "valued_at" timestamp,
        ADD COLUMN IF NOT EXISTS "failure_reason" text,
        ADD COLUMN IF NOT EXISTS "settled_at" timestamp
    `);

        // Create transaction_status_history table
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transaction_status_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transaction_id" uuid NOT NULL,
        "status" varchar(100) NOT NULL,
        "reason" text,
        "at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transaction_status_history" PRIMARY KEY ("id")
      )
    `);

        // Add FK: transaction_status_history -> transactions
        await queryRunner.query(`
      ALTER TABLE "transaction_status_history"
        ADD CONSTRAINT "FK_transaction_status_history_transaction_id"
        FOREIGN KEY ("transaction_id")
        REFERENCES "transactions"("id")
        ON DELETE CASCADE
    `);

        // Index for fast lookup by transaction
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_transaction_status_history_transaction_id"
      ON "transaction_status_history" ("transaction_id")
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "transaction_status_history"`);

        await queryRunner.query(`
      ALTER TABLE "transactions"
        DROP COLUMN IF EXISTS "token_address",
        DROP COLUMN IF EXISTS "token_symbol",
        DROP COLUMN IF EXISTS "gas_used",
        DROP COLUMN IF EXISTS "gas_price_gwei",
        DROP COLUMN IF EXISTS "network_fee_eth",
        DROP COLUMN IF EXISTS "network_fee_usd",
        DROP COLUMN IF EXISTS "exchange_rate",
        DROP COLUMN IF EXISTS "valued_at",
        DROP COLUMN IF EXISTS "failure_reason",
        DROP COLUMN IF EXISTS "settled_at"
    `);
    }
}
