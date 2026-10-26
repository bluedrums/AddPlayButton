import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST() {
  try {
    // Ensure the table exists
    await sql`
      CREATE TABLE IF NOT EXISTS test_data (
        id SERIAL PRIMARY KEY,
        message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Add a new entry
    const message = `Test entry from ${new Date().toISOString()}`;
    await sql`INSERT INTO test_data (message) VALUES (${message});`;

    return NextResponse.json({ success: true, message: 'Test data added successfully.' });
  } catch (error) {
    console.error('Database POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to add test data',
        details: 'Database request failed. Check POSTGRES_URL on the server and the function logs.',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    // Ensure the table exists before trying to read from it
    await sql`
      CREATE TABLE IF NOT EXISTS test_data (
        id SERIAL PRIMARY KEY,
        message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Get all entries
    const { rows } = await sql`SELECT * FROM test_data ORDER BY created_at DESC;`;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve test data',
        details: 'Database request failed. Check POSTGRES_URL on the server and the function logs.',
      },
      { status: 500 },
    );
  }
}
