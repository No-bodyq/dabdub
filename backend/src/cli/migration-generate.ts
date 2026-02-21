import 'dotenv/config';
import 'reflect-metadata';

// Note: Migration generation is a TypeORM CLI feature only
// To generate migrations from entities, use:
// npx typeorm migration:generate src/database/migrations/MigrationName -d dist/typeorm.config.js
// After running: npm run build

console.error('Migration generation requires the TypeORM CLI');
console.error(
  'To generate from entities, first create your entity files, then:',
);
console.error('1. npm run build');
console.error(
  '2. npx typeorm migration:generate -d dist/typeorm.config.js src/database/migrations/YourMigrationName',
);
console.error('');
console.error(
  'To create an empty migration template, manually create a file in src/database/migrations/',
);
process.exit(1);
