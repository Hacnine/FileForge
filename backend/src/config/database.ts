import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { env } from './env';

const connectionString = env.DATABASE_URL;
const pool = new pg.Pool({
  connectionString,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export const checkDatabaseHealth = async (): Promise<boolean> => {
  await prisma.$queryRaw`SELECT 1`;
  return true;
};

export default prisma;
