import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRiskAlertsTable1708369900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'risk_alerts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'severity',
            type: 'enum',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
          },
          {
            name: 'type',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'message',
            type: 'text',
          },
          {
            name: 'affectedTransactionId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'affectedMerchantId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'triggeredRuleId',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['OPEN', 'RESOLVED'],
            default: "'OPEN'",
          },
          {
            name: 'autoActionTaken',
            type: 'enum',
            enum: ['NO_ACTION', 'SUSPENDED_MERCHANT', 'REJECTED_TRANSACTION'],
            isNullable: true,
          },
          {
            name: 'resolution',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'resolvedById',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'resolvedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'risk_alerts',
      new TableIndex({
        name: 'IDX_risk_alerts_status_severity',
        columnNames: ['status', 'severity'],
      }),
    );

    await queryRunner.createIndex(
      'risk_alerts',
      new TableIndex({
        name: 'IDX_risk_alerts_transaction_id',
        columnNames: ['affectedTransactionId'],
      }),
    );

    await queryRunner.createIndex(
      'risk_alerts',
      new TableIndex({
        name: 'IDX_risk_alerts_merchant_id',
        columnNames: ['affectedMerchantId'],
      }),
    );

    await queryRunner.createIndex(
      'risk_alerts',
      new TableIndex({
        name: 'IDX_risk_alerts_rule_id',
        columnNames: ['triggeredRuleId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('risk_alerts');
  }
}
