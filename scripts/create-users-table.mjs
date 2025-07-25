import { sql } from '@vercel/postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function main() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        fid BIGINT PRIMARY KEY,
        username VARCHAR(255),
        display_name VARCHAR(255),
        pfp_url VARCHAR(255),
        custody_address VARCHAR(255),
        verifications JSONB
      );
    `;
    console.log('Table "users" created successfully.');
  } catch (error) {
    console.error('Error creating table "users":', error);
  }
}

main();
