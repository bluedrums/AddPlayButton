import { sql } from '@vercel/postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function createTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS play_buttons (
        id VARCHAR(255) NOT NULL,
        user_fid BIGINT NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_fid, id)
      );
    `;
    console.log('✅ "play_buttons" table created successfully.');
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createTable(); 