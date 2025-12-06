import { sql } from '@vercel/postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function main() {
  try {
    // Add order_index column to playlist_play_buttons table
    await sql`
      ALTER TABLE playlist_play_buttons
      ADD COLUMN IF NOT EXISTS order_index INTEGER;
    `;
    console.log('Added order_index column to playlist_play_buttons table.');

    // Populate order_index for existing records based on added_at
    await sql`
      UPDATE playlist_play_buttons ppb
      SET order_index = sub.row_num - 1
      FROM (
        SELECT 
          playlist_id, 
          play_button_id, 
          user_fid,
          ROW_NUMBER() OVER (PARTITION BY playlist_id, user_fid ORDER BY added_at ASC) as row_num
        FROM playlist_play_buttons
      ) sub
      WHERE ppb.playlist_id = sub.playlist_id
        AND ppb.play_button_id = sub.play_button_id
        AND ppb.user_fid = sub.user_fid
        AND ppb.order_index IS NULL;
    `;
    console.log('Populated order_index for existing records.');

    // Set NOT NULL constraint
    await sql`
      ALTER TABLE playlist_play_buttons
      ALTER COLUMN order_index SET NOT NULL;
    `;
    console.log('Set order_index as NOT NULL.');

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Error running migration:', error);
  }
}

main();

