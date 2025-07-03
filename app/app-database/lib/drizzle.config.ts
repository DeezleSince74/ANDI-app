import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/index.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://andi_user:change_me_in_production@localhost:5432/andi_db',
  },
  verbose: true,
  strict: true,
} satisfies Config;