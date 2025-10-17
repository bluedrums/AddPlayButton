import { sql } from '@vercel/postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function main() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS play_buttons (
        id VARCHAR(255),
        user_fid BIGINT,
        data JSONB,
        PRIMARY KEY (user_fid, id)
      );
    `;
    console.log('Table "play_buttons" created successfully.');
    
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

    await sql`
      CREATE TABLE IF NOT EXISTS playlists (
        id SERIAL PRIMARY KEY,
        user_fid BIGINT NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_fid) REFERENCES users(fid) ON DELETE CASCADE
      );
    `;
    console.log('Table "playlists" created successfully.');

    await sql`
      CREATE TABLE IF NOT EXISTS playlist_play_buttons (
        playlist_id INTEGER NOT NULL,
        play_button_id VARCHAR(255) NOT NULL,
        user_fid BIGINT NOT NULL,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (playlist_id, play_button_id, user_fid),
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (user_fid, play_button_id) REFERENCES play_buttons(user_fid, id) ON DELETE CASCADE
      );
    `;
    console.log('Table "playlist_play_buttons" created successfully.');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

main(); 