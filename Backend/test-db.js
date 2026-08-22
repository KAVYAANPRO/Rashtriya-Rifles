const mariadb = require('mariadb');
require('dotenv').config();

async function test() {
  console.log('Testing connection to:', process.env.DATABASE_URL);
  try {
    const url = process.env.DATABASE_URL.replace('mysql://', 'mariadb://');
    const pool = mariadb.createPool(url);
    const conn = await pool.getConnection();
    console.log('Successfully connected!');
    const res = await conn.query('SELECT 1 as val');
    console.log('Query result:', res);
    conn.release();
    pool.end();
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

test();
