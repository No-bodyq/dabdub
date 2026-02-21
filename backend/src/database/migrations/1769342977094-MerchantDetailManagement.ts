import { MigrationInterface, QueryRunner } from 'typeorm';

export class MerchantDetailManagement1769342977094 implements MigrationInterface {
    name = 'MerchantDetailManagement1769342977094';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to merchants table
        await queryRunner.query(`
      ALTER TABLE "merchants"
        ADD COLUMN IF NOT EXISTS "settlement_config" jsonb,
        ADD COLUMN IF NOT EXISTS "fee_structure" jsonb,
        ADD COLUMN IF NOT EXISTS "supported_chains" text[],
        ADD COLUMN IF NOT EXISTS "flags" jsonb DEFAULT '[]'
    `);

        // Add merchant_id foreign key to api_keys table
        await queryRunner.query(`
      ALTER TABLE "api_keys"
        ADD COLUMN IF NOT EXISTS "merchant_id" uuid,
        ADD COLUMN IF NOT EXISTS "last_used_at" timestamp
    `);

        // Add FK constraint for api_keys -> merchants (only if not already present)
        await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_api_keys_merchant_id'
        ) THEN
          ALTER TABLE "api_keys"
            ADD CONSTRAINT "FK_api_keys_merchant_id"
            FOREIGN KEY ("merchant_id")
            REFERENCES "merchants"("id")
            ON DELETE SET NULL;
        END IF;
      END;
      $$;
    `);

        // Create merchant_audit_logs table
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "merchant_audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchant_id" uuid NOT NULL,
        "action" varchar(100) NOT NULL,
        "changed_by" jsonb NOT NULL,
        "changes" jsonb NOT NULL DEFAULT '{}',
        "ip" varchar(64),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_merchant_audit_logs" PRIMARY KEY ("id")
      )
    `);

        // Add FK: merchant_audit_logs -> merchants
        await queryRunner.query(`
      ALTER TABLE "merchant_audit_logs"
        ADD CONSTRAINT "FK_merchant_audit_logs_merchant_id"
        FOREIGN KEY ("merchant_id")
        REFERENCES "merchants"("id")
        ON DELETE CASCADE
    `);

        // Add index on merchant_id for fast lookups
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_merchant_audit_logs_merchant_id"
      ON "merchant_audit_logs" ("merchant_id")
    `);

        // Create merchant_notes table
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "merchant_notes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchant_id" uuid NOT NULL,
        "content" text NOT NULL,
        "created_by" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_merchant_notes" PRIMARY KEY ("id")
      )
    `);

        // Add FK: merchant_notes -> merchants
        await queryRunner.query(`
      ALTER TABLE "merchant_notes"
        ADD CONSTRAINT "FK_merchant_notes_merchant_id"
        FOREIGN KEY ("merchant_id")
        REFERENCES "merchants"("id")
        ON DELETE CASCADE
    `);

        // Add index on merchant_id for fast lookups
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_merchant_notes_merchant_id"
      ON "merchant_notes" ("merchant_id")
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop merchant_notes
        await queryRunner.query(`DROP TABLE IF EXISTS "merchant_notes"`);

        // Drop merchant_audit_logs
        await queryRunner.query(`DROP TABLE IF EXISTS "merchant_audit_logs"`);

        // Remove added columns from api_keys
        await queryRunner.query(`
      ALTER TABLE "api_keys"
        DROP COLUMN IF EXISTS "merchant_id",
        DROP COLUMN IF EXISTS "last_used_at"
    `);

        // Remove added columns from merchants
        await queryRunner.query(`
      ALTER TABLE "merchants"
        DROP COLUMN IF EXISTS "settlement_config",
        DROP COLUMN IF EXISTS "fee_structure",
        DROP COLUMN IF EXISTS "supported_chains",
        DROP COLUMN IF EXISTS "flags"
    `);
    }
}
