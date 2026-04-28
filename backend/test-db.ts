import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';

async function testDatabaseConnection() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://saas_user:Afo0mOSniFdgKLCMM7EfcZpnFkKULFBS@dpg-d7hkrp0sfn5c73eb2fvg-a.oregon-postgres.render.com/saas_db_87n4';
  
  console.log('Testing database connection...');
  console.log('Connection string:', connectionString.split('@')[1] || 'hidden');

  try {
    const pool = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    const result = await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');
    console.log('Current time:', result.rows[0].now);

    // Check for tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\nExisting tables:');
    if (tables.rows.length === 0) {
      console.log('  ✗ No tables found - migrations need to be run!');
    } else {
      tables.rows.forEach(row => {
        console.log(`  ✓ ${row.table_name}`);
      });
    }

    await pool.end();
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    process.exit(1);
  }
}

testDatabaseConnection();
