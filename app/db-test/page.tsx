'use client';

import { useState, useEffect } from 'react';

export default function DbTestPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db-test');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || 'Failed to fetch data');
      }
      const jsonData = await res.json();
      setData(jsonData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTestData = async () => {
    try {
      const res = await fetch('/api/db-test', { method: 'POST' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || 'Failed to add data');
      }
      // Refresh the data after adding a new entry
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Database Test Page</h1>
      <p>This page tests writing to and reading from the Neon database via a Vercel serverless function.</p>
      
      <button onClick={addTestData} style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}>
        Add Test Data
      </button>

      <h2>Test Data from Database:</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {data.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {data.map((item) => (
            <li key={item.id} style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '1rem', marginBottom: '0.5rem' }}>
              <strong>ID:</strong> {item.id} <br />
              <strong>Message:</strong> {item.message} <br />
              <strong>Created At:</strong> {new Date(item.created_at).toLocaleString()}
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p>No test data found.</p>
      )}
    </div>
  );
}
