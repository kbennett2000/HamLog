async function CreateTables() {
  const dbName = "HamLogDB";
  const mysql = require("mysql2/promise"); // MySQL library for asynchronous operations
  // Create a MySQL connection
  const connection = await mysql.createConnection({
    host: "192.168.1.85",
    user: "testUser",
    password: "password1",
    database: `${dbName}`,
  });

  await connection.execute(
    "CREATE TABLE `HamLogDB`.`Contacts` (`QSO_ID` INT AUTO_INCREMENT, `QSO_Date` DATETIME NULL, `QSO_MTZTime` VARCHAR(12) NULL, `QSO_Callsign` VARCHAR(12) NULL, `QSO_Frequency` VARCHAR(15) NULL, `QSO_Notes` VARCHAR(4096) NULL, `QSO_Received` VARCHAR(10) NULL, `QSO_Sent` VARCHAR(10) NULL, PRIMARY KEY (`QSO_ID`));"
  );
  console.log("Contacts table created.");

  await connection.execute(
    "CREATE TABLE `HamLogDB`.`POTA_QSOs` (`POTA_QSO_ID` INT AUTO_INCREMENT, `QSO_ID` INT, `POTAPark_ID` VARCHAR(10), `QSO_Type` VARCHAR(2), PRIMARY KEY (`POTA_QSO_ID`), FOREIGN KEY (`QSO_ID`) REFERENCES `Contacts`(`QSO_ID`));"
  );
  console.log("POTA_QSOs table created.");

  await connection.execute(
    "CREATE TABLE `HamLogDB`.`Contests` (`CONTEST_ID` INT AUTO_INCREMENT, `CONTEST_NAME` VARCHAR(512), `CONTEST_DESCRIPTION` VARCHAR(1024), `CONTEST_BEGINS_ON_DATE` DATETIME NULL, `CONTEST_BEGINS_ON_TIME` DATETIME NULL, `CONTEST_ENDS_ON_DATE` DATETIME NULL, `CONTEST_ENDS_ON_TIME` DATETIME NULL, `CONTEST_EXCHANGE_DATA` VARCHAR(1024) NULL, PRIMARY KEY (`CONTEST_ID`));"
  );
  console.log("Contests table created.");

  await connection.execute(
    "CREATE TABLE `HamLogDB`.`Contest_QSOs` (`CONTEST_QSO_ID` INT AUTO_INCREMENT, `QSO_ID` INT, `CONTEST_ID` INT, `CONTEST_QSO_NUMBER` VARCHAR(10), `CONTEST_QSO_EXCHANGE_DATA` VARCHAR(128), PRIMARY KEY (`CONTEST_QSO_ID`), FOREIGN KEY (`QSO_ID`) REFERENCES `Contacts`(`QSO_ID`), FOREIGN KEY (`CONTEST_ID`) REFERENCES `Contests`(`CONTEST_ID`));"
  );
  console.log("Contest_QSOs table created.");

  // Close the MySQL connection
  await connection.end();
}

CreateTables();
