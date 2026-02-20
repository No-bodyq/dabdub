import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateAdminAuthTables1708444800000 implements MigrationInterface {
  name = 'CreateAdminAuthTables1708444800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create admin_sessions table
    await queryRunner.createTable(
      new Table({
        name: 'admin_sessions',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'refreshToken',
            type: 'text',
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'userId',
            type: 'varchar',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create admin_login_attempts table
    await queryRunner.createTable(
      new Table({
        name: 'admin_login_attempts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'successful',
            type: 'boolean',
            default: false,
          },
          {
            name: 'failureReason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for admin_login_attempts
    await queryRunner.createIndex(
      'admin_login_attempts',
      new Index('IDX_admin_login_attempts_email_created', ['email', 'createdAt']),
    );

    await queryRunner.createIndex(
      'admin_login_attempts',
      new Index('IDX_admin_login_attempts_ip_created', ['ipAddress', 'createdAt']),
    );

    // Create index for admin_sessions
    await queryRunner.createIndex(
      'admin_sessions',
      new Index('IDX_admin_sessions_user_active', ['userId', 'isActive']),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('admin_login_attempts');
    await queryRunner.dropTable('admin_sessions');
  }
}