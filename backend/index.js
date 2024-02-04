import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

let dbHamLog = mysql.createPool({
  host: "192.168.1.85",
  user: "testUser",
  password: "password1",
  database: "HamLogDB",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/*
// READ Endpoint
app.get("/Read_Contacts", async (req, res) => {
  const promise = dbHamLog.promise();
  const query = "SELECT * FROM Contacts ORDER BY QSO_ID DESC;";
  const [rows, fields] = await promise.execute(query);
  return res.status(200).json({ Contacts: rows });
});

// READ Endpoint
app.get("/Read_POTA_QSOs", async (req, res) => {
  const { QSO_ID } = req.query;
  const promise = dbHamLog.promise();
  const query = `SELECT * FROM POTA_QSOs WHERE QSO_ID = ${mysql.escape(QSO_ID)}`;
  console.log(query);
  const [rows, fields] = await promise.execute(query);
  return res.status(200).json({ POTA_QSOs: rows });
});
*/

// CREATE Endpoint
app.get("/Create_Contacts", async (req, res) => {
  const { QSO_Date, QSO_MTZTime, QSO_Callsign, QSO_Frequency, QSO_Notes, QSO_Received, QSO_Sent } = req.query;
  const promise = dbHamLog.promise();
  const formatted_QSO_Date = formatDate(QSO_Date) + " 00:00:00";
  const query = `INSERT INTO HamLogDB.Contacts (\`QSO_Date\`, \`QSO_MTZTime\`, \`QSO_Callsign\`, \`QSO_Frequency\`, \`QSO_Notes\`, \`QSO_Received\`, \`QSO_Sent\`) `;  
  const queryValue = `VALUES (\'${formatted_QSO_Date}\', \'${QSO_MTZTime}\', \'${QSO_Callsign}\', \'${QSO_Frequency}\', \'${QSO_Notes}\', \'${QSO_Received}\', \'${QSO_Sent}\')`;
  const [rows, fields] = await promise.execute(query + queryValue);
  return res.status(200).json({ Contacts: rows });
});

// CREATE Endpoint
app.get("/Create_POTA_QSOs", async (req, res) => {
  const { QSO_ID, POTAPark_ID, QSO_Type } = req.query;
  const promise = dbHamLog.promise();
  const query = `INSERT INTO HamLogDB.POTA_QSOs (\`QSO_ID\`, \`POTAPark_ID\`, \`QSO_Type\`) `;  
  const queryValue = `VALUES (\'${QSO_ID}\', \'${POTAPark_ID}\', \'${QSO_Type}\')`;
  const [rows, fields] = await promise.execute(query + queryValue);
  return res.status(200).json({ POTA_QSOs: rows });
});

// CREATE Endpoint
app.get("/Create_POTA_QSOs", async (req, res) => {
  const { QSO_ID, POTAPark_ID, QSO_Type } = req.query;
  const promise = dbHamLog.promise();
  const query = `INSERT INTO HamLogDB.POTA_QSOs (\`QSO_ID\`, \`POTAPark_ID\`, \`QSO_Type\`) `;  
  const queryValue = `VALUES (\'${QSO_ID}\', \'${POTAPark_ID}\', \'${QSO_Type}\')`;
  const [rows, fields] = await promise.execute(query + queryValue);
  return res.status(200).json({ POTA_QSOs: rows });
});

// CREATE Endpoint
app.get("/Create_Contest_QSOs", async (req, res) => {
  const { QSO_ID, Contest_ID, Contest_QSO_Number, Contest_QSO_Exchange_Data } = req.query;
  const promise = dbHamLog.promise();
  const query = `INSERT INTO HamLogDB.Contest_QSOs (\`QSO_ID\`, \`Contest_ID\`, \`Contest_QSO_Number\`, \`Contest_QSO_Exchange_Data\`) `;  
  const queryValue = `VALUES (\'${QSO_ID}\', \'${Contest_ID}\', \'${Contest_QSO_Number}\', \'${Contest_QSO_Exchange_Data}\')`;
  const [rows, fields] = await promise.execute(query + queryValue);
  return res.status(200).json({ POTA_QSOs: rows });
});

// DELETE Endpoint
app.get("/Delete_Contacts", async (req, res) => {
  const { QSO_ID } = req.query;
  const promise = dbHamLog.promise();

  let query = `DELETE FROM POTA_QSOs WHERE QSO_ID = \'${QSO_ID}\';`;
  let [rows, fields] = await promise.execute(query);

  query = `DELETE FROM Contest_QSOs WHERE QSO_ID = \'${QSO_ID}\';`;
  [rows, fields] = await promise.execute(query);

  query = `DELETE FROM Contacts WHERE QSO_ID = \'${QSO_ID}\';`;
  [rows, fields] = await promise.execute(query);

  return res.status(200).json({ Contacts: rows });
});

// getContactsAndPOTAQSOs Endpoint
app.get('/getContactsAndPOTAQSOs', async (req, res) => {
  try {
    const promise = dbHamLog.promise();

    // Fetch all records from Contacts table
    const [contactsRows] = await promise.execute('SELECT * FROM Contacts ORDER BY QSO_DATE DESC, QSO_MTZTime DESC');

    // Fetch joined records from POTA_QSOs table
    const [potaQsosRows] = await promise.execute(`SELECT Contacts.*, POTA_QSOs.* FROM Contacts LEFT JOIN POTA_QSOs ON Contacts.QSO_ID = POTA_QSOs.QSO_ID`);

    // Organize data in a nested structure
    const result = contactsRows.map(contact => {
      const relatedPOTAQSOs = potaQsosRows
        .filter(potaQSO => potaQSO.QSO_ID === contact.QSO_ID)
        .map(({ POTA_QSO_ID, QSO_ID, POTAPark_ID, QSO_Type }) => ({
          POTA_QSO_ID,
          QSO_ID,
          POTAPark_ID,
          QSO_Type,
        }));

      return {
        ...contact,
        POTA_QSOs: relatedPOTAQSOs,
      };
    });

    res.json(result);

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Get_Contacts_for_Callsign
app.get("/Get_Contacts_for_Callsign", async (req, res) => {
  const { QSO_Callsign } = req.query;
  const promise = dbHamLog.promise();
  const query = `SELECT * FROM Contacts WHERE QSO_Callsign = \'${QSO_Callsign}\' ORDER BY QSO_ID DESC`;  
  const [rows, fields] = await promise.execute(query);
  return res.status(200).json({ Contacts: rows });
});

// Get_Contacts_for_ParkNumber
app.get("/Get_Contacts_for_ParkNumber", async (req, res) => {
  const { ParkNumber } = req.query;
  const promise = dbHamLog.promise();
  const query = `SELECT POTA_QSOs.*, Contacts.* FROM POTA_QSOs INNER JOIN Contacts ON POTA_QSOs.QSO_ID = Contacts.QSO_ID WHERE POTA_QSOs.POTAPark_ID = \'${ParkNumber}\' ORDER BY POTA_QSOs.POTA_QSO_ID DESC`;  
  const [rows, fields] = await promise.execute(query);
  return res.status(200).json({ Contacts: rows });
});

app.get("/Last_Insert_ID", async (req, res) => {
  const promise = dbHamLog.promise();
  const query = "SELECT LAST_INSERT_ID();";
  const [rows, fields] = await promise.execute(query);
  return res.status(200).json({ LastInsertID: rows });
});

function formatDate(inputString) {
  const inputDate = new Date(inputString);
  
  if (!isNaN(inputDate)) {
    const year = inputDate.getFullYear();
    const month = String(inputDate.getMonth() + 1).padStart(2, '0');
    const day = String(inputDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } else {
    return "Invalid Date";
  }
}

app.listen(7800, "0.0.0.0", () => {
  console.log("Connected to backend");
});
