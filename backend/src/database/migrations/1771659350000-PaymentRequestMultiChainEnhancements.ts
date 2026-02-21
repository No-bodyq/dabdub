import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentRequestMultiChainEnhancements1771659350000
  implements MigrationInterface
{
  name = 'PaymentRequestMultiChainEnhancements1771659350000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payment_requests"
        ADD COLUMN IF NOT EXISTS "block_number" bigint,
        ADD COLUMN IF NOT EXISTS "confirmations" integer,
        ADD COLUMN IF NOT EXISTS "customer_wallet_address" varchar(128),
        ADD COLUMN IF NOT EXISTS "customer_id" varchar(255),
        ADD COLUMN IF NOT EXISTS "webhook_url" varchar(500)
    `);

    await queryRunner.query(`
      ALTER TABLE "payment_requests"
        ALTER COLUMN "qr_code_data" TYPE jsonb
        USING CASE
          WHEN "qr_code_data" IS NULL THEN NULL
          WHEN "qr_code_data" ~ '^\\s*\\{' THEN "qr_code_data"::jsonb
          ELSE jsonb_build_object('imageBase64', "qr_code_data", 'format', 'sep0007')
        END
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_payment_requests_tx_hash_network"
      ON "payment_requests" ("on_chain_tx_hash", "stellar_network")
      WHERE "on_chain_tx_hash" IS NOT NULL AND "stellar_network" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_payment_requests_tx_hash_network"
    `);

    await queryRunner.query(`
      ALTER TABLE "payment_requests"
        ALTER COLUMN "qr_code_data" TYPE text
        USING CASE
          WHEN "qr_code_data" IS NULL THEN NULL
          WHEN jsonb_typeof("qr_code_data") = 'object' AND "qr_code_data" ? 'imageBase64'
            THEN "qr_code_data"->>'imageBase64'
          ELSE "qr_code_data"::text
        END
    `);

    await queryRunner.query(`
      ALTER TABLE "payment_requests"
        DROP COLUMN IF EXISTS "block_number",
        DROP COLUMN IF EXISTS "confirmations",
        DROP COLUMN IF EXISTS "customer_wallet_address",
        DROP COLUMN IF EXISTS "customer_id",
        DROP COLUMN IF EXISTS "webhook_url"
    `);
  }
}
