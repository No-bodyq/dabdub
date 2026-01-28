"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var typeorm_1 = require("typeorm");
var path = require("path");
var password = process.env.DB_PASSWORD;
var isProduction = process.env.NODE_ENV === 'production';
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: password && String(password).trim(),
    database: process.env.DB_NAME || 'dabdub_dev',
    entities: isProduction
        ? [path.join(__dirname, '/database/**/*.entity.js')]
        : [path.join(__dirname, '/src/database/**/*.entity.ts')],
    migrations: isProduction
        ? [path.join(__dirname, '/database/migrations/*.js')]
        : [path.join(__dirname, '/src/database/migrations/*.ts')],
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    logger: 'advanced-console',
    migrationsRun: false,
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
});
