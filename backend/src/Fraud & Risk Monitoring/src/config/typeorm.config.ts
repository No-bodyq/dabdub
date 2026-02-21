import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { RiskRule, RiskAlert } from '../../modules/risk/entities';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'fraud_risk_monitoring',
  entities: [RiskRule, RiskAlert],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
  migrations: ['src/database/migrations/**/*.ts'],
  subscribers: ['src/database/subscribers/**/*.ts'],
  cli: {
    migrationsDir: 'src/database/migrations',
    subscribersDir: 'src/database/subscribers',
  },
};
