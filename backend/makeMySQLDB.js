import 'dotenv/config';
import mysql from 'mysql2/promise';

async function CreateDatabase() {
  const dbName = process.env.DB_NAME || 'HamLogDB';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  console.log(`Database ${dbName} created.`);
  await connection.end();
}

CreateDatabase();
