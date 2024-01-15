async function CreateTables() {
  const dbName = "HamLogDB";
  const table1Name = "Contacts";
  const table2Name = "POTA";
  const mysql = require("mysql2/promise"); // MySQL library for asynchronous operations
  // Create a MySQL connection
  const connection = await mysql.createConnection({
    host: "192.168.0.235",
    user: "testUser",
    password: "password1",
    database: `${dbName}`,
  });

  // TODO: set proper field names
  // Insert data into the ConditionReports table
  await connection.execute(
    `CREATE TABLE ${table1Name} (QSO_ID VARCHAR(255), QSO_Date VARCHAR(255), QSO_UTCTime VARCHAR(255), QSO_MTZTime VARCHAR(255), QSO_Callsign VARCHAR(255), QSO_Frequency VARCHAR(255), QSO_Notes VARCHAR(4096))`
  );
  console.log(`Database Table ${table1Name} created.`);

  // TODO: set proper field names
  // Insert data into the ConditionReports table
  await connection.execute(
    `CREATE TABLE ${table2Name} (POTA_OSO_ID VARCHAR(255), QSO_ID VARCHAR(255), POTAPark_ID VARCHAR(255), QSO_Type VARCHAR(255))`
  );
  console.log(`Database Table ${table2Name} created.`);

  // Close the MySQL connection
  await connection.end();
}

CreateTables();
