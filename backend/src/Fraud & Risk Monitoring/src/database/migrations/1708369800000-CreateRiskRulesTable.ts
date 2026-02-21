import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRiskRulesTable1708369800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'risk_rules',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'ruleType',
            type: 'enum',
            enum: [
              'TRANSACTION_AMOUNT',
              'TRANSACTION_VELOCITY',
              'MERCHANT_VOLUME',
              'ADDRESS_BLACKLIST',
              'COUNTRY_BLOCK',
            ],
          },
          {
            name: 'conditions',
            type: 'jsonb',
          },
          {
            name: 'severity',
            type: 'enum',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
          },
          {
            name: 'isEnabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'autoBlock',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdById',
            type: 'varchar',
            length: '255',
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
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'risk_rules',
      new TableIndex({
        name: 'IDX_risk_rules_type_enabled',
        columnNames: ['ruleType', 'isEnabled'],
      }),
    );

    await queryRunner.createIndex(
      'risk_rules',
      new TableIndex({
        name: 'IDX_risk_rules_created_by',
        columnNames: ['createdById'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('risk_rules');
  }
}
