## CONTACTS Table
- QSO_ID (pk)
- Date
- UTCTime
- MTZTime
- Callsign
- Frequency
- Notes


## POTA_QSOS
- POTA_QSO_ID (pk)
- QSO_ID (fk)
- POTAPark_ID
- QSO_Type (1 for Hunter, 2 for Activator)


# TODO: What fields are needed to record a SOTA hunt, activation?
## SOTA_QSOS
- SOTA_QSO_ID (pk)
- QSO_ID (fk)


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
