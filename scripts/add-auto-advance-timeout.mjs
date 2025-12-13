import { sql } from '@vercel/postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function main() {
  try {
    // Add auto_advance_timeout column to playlist_play_buttons table
    await sql`
      ALTER TABLE playlist_play_buttons
      ADD COLUMN IF NOT EXISTS auto_advance_timeout INTEGER DEFAULT 4;
    `;
    console.log('Added auto_advance_timeout column to playlist_play_buttons table.');

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Error running migration:', error);
  }
}

main();
