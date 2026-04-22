import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminAlerts1760000001000 implements MigrationInterface {
  name = 'CreateAdminAlerts1760000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."admin_alerts_type_enum" AS ENUM('redis_health', 'stellar_health')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."admin_alerts_status_enum" AS ENUM('open', 'acknowledged')
    `);
    await queryRunner.query(`
      CREATE TABLE "admin_alerts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "type" "public"."admin_alerts_type_enum" NOT NULL,
        "dedupe_key" character varying(128) NOT NULL,
        "status" "public"."admin_alerts_status_enum" NOT NULL DEFAULT 'open',
        "message" text NOT NULL,
        "occurrence_count" integer NOT NULL DEFAULT '1',
        "threshold_value" integer NOT NULL,
        "metadata" jsonb,
        "last_notified_at" TIMESTAMP WITH TIME ZONE,
        "acknowledged_at" TIMESTAMP WITH TIME ZONE,
        "acknowledged_by" uuid,
        CONSTRAINT "UQ_admin_alerts_type_dedupe" UNIQUE ("type", "dedupe_key"),
        CONSTRAINT "PK_admin_alerts_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "admin_alerts"`);
    await queryRunner.query(`DROP TYPE "public"."admin_alerts_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."admin_alerts_type_enum"`);
  }
}
