# SEE:
- [makeMySQLDB.js](/backend/makeMySQLDB.js)
- [makeMySQLTables.js](/backend/makeMySQLTables.js)

## Contacts
```sql
CREATE TABLE `testDB`.`Contacts` (
  `QSO_ID` INT AUTO_INCREMENT,
  `QSO_Date` DATETIME NULL,
  `QSO_UTCTime` VARCHAR(12) NULL,
  `QSO_MTZTime` VARCHAR(12) NULL,
  `QSO_Callsign` VARCHAR(12) NULL,
  `QSO_Frequency` VARCHAR(15) NULL,
  `QSO_Notes` VARCHAR(4096) NULL,
  `QSO_Received` VARCHAR(10) NULL,
  `QSO_Sent` VARCHAR(10) NULL,
  PRIMARY KEY (`QSO_ID`)
);
```

## POTA_QSOs
*QSO_Type (1 for Hunter, 2 for Activator)
```sql
CREATE TABLE `testDB`.`POTA_QSOs` (
  `POTA_QSO_ID` INT AUTO_INCREMENT,
  `QSO_ID` INT,
  `POTAPark_ID` VARCHAR(10), 
  `QSO_Type` VARCHAR(2),
  PRIMARY KEY (`POTA_QSO_ID`),
  FOREIGN KEY (`QSO_ID`) REFERENCES `Contacts`(`QSO_ID`)
);
```


## SOTA_QSOS
- SOTA_QSO_ID (pk)
- QSO_ID (fk)
### TODO: What fields are needed to record a SOTA hunt, activation?



## Contest_QSOs
*CONTEST_QSO_NUMBER (autonumber field in application, counts the number of QSOs in the contest)
*CONTEST_QSO_CONTEST_EXCHANGE_DATE (VALUES of the data that is supposed to be exchanged during QSOs, such as grid square number, signal reports, contact id, etc)
```sql
CREATE TABLE `testDB`.`Contest_QSOs` (
  `CONTEST_QSO_ID` INT AUTO_INCREMENT,
  `QSO_ID` INT,
  `CONTEST_ID` INT, 
  `CONTEST_QSO_NUMBER` VARCHAR(10),
  `CONTEST_QSO_EXCHANGE_DATA` VARCHAR(128), 
  PRIMARY KEY (`CONTEST_QSO_ID`),
  FOREIGN KEY (`QSO_ID`) REFERENCES `Contacts`(`QSO_ID`),
  FOREIGN KEY (`CONTEST_ID`) REFERENCES `Contests`(`CONTEST_ID`)
);
```

  
## Contests
*CONTEST_EXCHANGE_DATA (Descripton of the data that is supposed to be exchanged during QSOs, such as grid square number, signal reports, contact id, etc)
 ```sql
CREATE TABLE `testDB`.`Contests` (
  `CONTEST_ID` INT AUTO_INCREMENT,
  `CONTEST_NAME` VARCHAR(512), 
  `CONTEST_DESCRIPTION` VARCHAR(1024),
  `CONTEST_BEGINS_ON_DATE` DATETIME NULL,
  `CONTEST_BEGINS_ON_TIME` DATETIME NULL,
  `CONTEST_ENDS_ON_DATE` DATETIME NULL,
  `CONTEST_ENDS_ON_TIME` DATETIME NULL,
  `CONTEST_EXCHANGE_DATA` VARCHAR(1024) NULL,
  PRIMARY KEY (`CONTEST_ID`)
);
``` 
