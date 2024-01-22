// MySQL Create Database

async function CreateDatabase() {
  const dbName = "HamLogDB";
  const mysql = require("mysql2/promise"); // MySQL library for asynchronous operations
  // Create a MySQL connection
  const connection = await mysql.createConnection({
    host: "192.168.1.85",
    user: "testUser",
    password: "password1",
  });
  // Insert data into the ConditionReports table
  await connection.execute(`CREATE DATABASE ${dbName}`);

  console.log(`Database ${dbName} created.`);

  // Close the MySQL connection
  await connection.end();
}

CreateDatabase();
