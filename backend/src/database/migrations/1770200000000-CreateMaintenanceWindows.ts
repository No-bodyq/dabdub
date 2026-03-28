import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

export class CreateMaintenanceWindows1770200000000 implements MigrationInterface {
  name = 'CreateMaintenanceWindows1770200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'maintenance_windows',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'startAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'endAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'affectedServices',
            type: 'text',
            isArray: true,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['scheduled', 'active', 'completed', 'cancelled'],
            default: "'scheduled'",
            isNullable: false,
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for efficient querying (using CONCURRENTLY for safety)
    await queryRunner.query(`CREATE INDEX CONCURRENTLY "IDX_maintenance_windows_status" ON "maintenance_windows" ("status")`);
    await queryRunner.query(`CREATE INDEX CONCURRENTLY "IDX_maintenance_windows_start_at" ON "maintenance_windows" ("startAt")`);
    await queryRunner.query(`CREATE INDEX CONCURRENTLY "IDX_maintenance_windows_end_at" ON "maintenance_windows" ("endAt")`);
    await queryRunner.query(`CREATE INDEX CONCURRENTLY "IDX_maintenance_windows_status_start_end" ON "maintenance_windows" ("status", "startAt", "endAt")`);

    // Create foreign key to admins table
    await queryRunner.createForeignKey(
      'maintenance_windows',
      new ForeignKey({
        columnNames: ['createdBy'],
        referencedTableName: 'admins',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('maintenance_windows');
  }
}