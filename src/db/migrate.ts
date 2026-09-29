import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { env } from '../server/env';
import { logger } from '../utils/logger';

async function runMigrations() {
  if (!env.DATABASE_URL) {
    logger.warn('DATABASE_URL not set, skipping migration');
    return;
  }
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool);
  logger.info('Running database migrations...');
  await migrate(db, { migrationsFolder: 'src/db/migrations' });
  logger.info('Database migrations completed successfully');
  await pool.end();
}

runMigrations().catch((err) => {
  logger.error('Migration failed:', err);
  process.exit(1);
});
