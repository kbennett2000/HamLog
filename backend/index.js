import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

let dbHamLog = mysql.createPool({
  host: "192.168.0.235",
  user: "testUser",
  password: "password1",
  database: "HamLogDB",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// READ Endpoint
app.get("/Read_Contacts", async (req, res) => {
  const promise = dbHam.promise();
  const query = "SELECT * FROM Contacts";
  const [rows, fields] = await promise.execute(query);
  return res.status(200).json({ ConditionReports: rows });
});

// TODO: Add correct field names
// TODO: Pass parameters in
// CREATE endpoint
app.get("/Create_Contacts", async (req, res) => {
  const promise = dbHam.promise();
  const value1 = "something";
  const value2 = "something else";
  const value3 = "another something else";
  const query = `INSERT INTO Contacts (column1, column2, column3) VALUES (\"${value1}\", \"${value2}\", \"${value3}\")`;
  const [rows, fields] = await promise.execute(query);
  return res.status(200).json({ ConditionReports: rows });
});

// TODO: Add correct field names
// TODO: Pass parameters in
// TODO: Add UPDATE endpoint
app.get("/Update_Contacts", async (req, res) => {
  const promise = dbHam.promise();
  const value1 = "something";
  const value2 = "something else";
  const value3 = "another something else";
  const newValue1 = "new val 1";
  const newValue2 = "new val 2";
  const newValue3 = "new val 3";
  const query = `UPDATE Contacts SET column1 = \"${newValue1}\", column2 = \"${newValue2}\", column3 = \"${newValue3}\" WHERE  column1 = \"${value1}\", column2 = \"${value2}\", column3 = \"${value3}\"`;
  const [rows, fields] = await promise.execute(query);
  return res.status(200).json({ ConditionReports: rows });
});

// TODO: Add correct field names
// TODO: Pass parameters in
// TODO: Add DELETE endpoint
app.get("/Create_Contacts", async (req, res) => {
  const promise = dbHam.promise();
  const value1 = "something";
  const value2 = "something else";
  const value3 = "another something else";
  const query = `DELETE FROM Contacts WHERE column1 = \"${value1}\", column2 = \"${value2}\", column3 = \"${value3}\"`;
  const [rows, fields] = await promise.execute(query);
  return res.status(200).json({ ConditionReports: rows });
});

// TODO: Add CRUD endpoint for POTA_Hunter_Table

app.listen(8800, "0.0.0.0", () => {
  console.log("Connected to backend");
});
