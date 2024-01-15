# SEE:
- [makeMySQLDB.js](/backend/makeMySQLDB.js)
- [makeMySQLTables.js](/backend/makeMySQLTables.js)

## CONTACTS Table
```sql
CREATE TABLE `testDB`.`Contacts` (
  `QSO_ID` INT AUTO_INCREMENT,
  `QSO_Date` DATETIME NULL,
  `QSO_UTCTime` VARCHAR(45) NULL,
  `QSO_MTZTime` VARCHAR(45) NULL,
  `QSO_Callsign` VARCHAR(45) NULL,
  `QSO_Frequency` VARCHAR(45) NULL,
  `QSO_Notes` VARCHAR(45) NULL,
  `QSO_Received` VARCHAR(45) NULL,
  `QSO_Sent` VARCHAR(45) NULL,
  PRIMARY KEY (`QSO_ID`)
);
```

## POTA_QSOS
- POTA_QSO_ID (pk)
- QSO_ID (fk)
- POTAPark_ID
- QSO_Type (1 for Hunter, 2 for Activator)



## SOTA_QSOS
- SOTA_QSO_ID (pk)
- QSO_ID (fk)
### TODO: What fields are needed to record a SOTA hunt, activation?



## CONTEST_QSOS
- CONTEST_QSO_ID (pk)
- CONTEST_ID (fk)
- CONTEST_QSO_NUMBER (autonumber field, counts the number of QSOs in the contest)
- CONTEST_QSO_CONTEST_EXCHANGE_DATE (VALUES of the data that is supposed to be exchanged during QSOs, such as grid square number, signal reports, contact id, etc)


  
## CONTEST_INFO
- CONTEST_ID (pk)
- CONTEST_NAME
- CONTEST_DESCRIPTION
- CONTEST_BEGINS_ON_DATE
- CONTEST_BEGINS_ON_TIME
- CONTEST_ENDS_ON_DATE
- CONTEST_ENDS_ON_TIME
- CONTEST_EXCHANGE_DATA (Descripton of the data that is supposed to be exchanged during QSOs, such as grid square number, signal reports, contact id, etc)
