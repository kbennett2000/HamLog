-- HamLog demo seed data — FICTIONAL, for documentation screenshots only.
--
-- IMPORTANT: Every callsign, name, and location below is invented for
-- illustration. Ham radio has no formal "example callsign" block, so these
-- are paired with obviously-fictional operator names and locations to make
-- clear they are demo data, not real operators. This file is loaded ONLY into
-- the throwaway `hamlog-demo` instance, never into a production database.
--
-- Demo login:  username `demo`  /  password `demo1234`

SET FOREIGN_KEY_CHECKS = 0;

-- Demo operator (password hash is bcryptjs of "demo1234")
INSERT INTO `Users` (id, username, password_hash, callsign) VALUES
  (1, 'demo', '$2b$10$ig6tHGd03Vzz0PnMt5xtpudbb.2hwUNpONGy73qCOhLyF6G8hrm6a', 'W1DEMO');

-- Worked stations — fictional operators around the world
INSERT INTO `ContactInfo`
  (ContactInfo_Callsign, ContactInfo_Name, ContactInfo_Street, ContactInfo_City, ContactInfo_usState, ContactInfo_AddressCountry, ContactInfo_Latitude, ContactInfo_Longitude, ContactInfo_ITUZone, ContactInfo_GridSquare, ContactInfo_QTH, ContactInfo_Country)
VALUES
  ('VE3XMP', 'Alex Maple',     '', 'Toronto',      'ON', 'Canada',         '43.6532',  '-79.3832',  '4',  'FN03', '', 'Canada'),
  ('G0TST',  'Jamie Thatcher', '', 'London',       '',   'United Kingdom', '51.5074',  '-0.1278',   '27', 'IO91', '', 'United Kingdom'),
  ('JA1EXM', 'Kenji Tanaka',   '', 'Tokyo',        '',   'Japan',          '35.6762',  '139.6503',  '45', 'PM95', '', 'Japan'),
  ('VK2SMP', 'Sam Porter',     '', 'Sydney',       'NSW','Australia',      '-33.8688', '151.2093',  '59', 'QF56', '', 'Australia'),
  ('DL1DMO', 'Lena Bauer',     '', 'Berlin',       '',   'Germany',        '52.5200',  '13.4050',   '28', 'JO62', '', 'Germany'),
  ('EA4FOO', 'Pablo Ramirez',  '', 'Madrid',       '',   'Spain',          '40.4168',  '-3.7038',   '37', 'IN80', '', 'Spain'),
  ('W6MOK',  'Pat Rivera',     '', 'Los Angeles',  'CA', 'United States',  '34.0522',  '-118.2437', '6',  'DM04', '', 'United States'),
  ('K4FAK',  'Jordan Bell',    '', 'Atlanta',      'GA', 'United States',  '33.7490',  '-84.3880',  '8',  'EM73', '', 'United States'),
  ('ZL1AOT', 'Robin Roa',      '', 'Auckland',     '',   'New Zealand',    '-36.8485', '174.7633',  '60', 'RF73', '', 'New Zealand'),
  ('PY2RIO', 'Bruno Alves',    '', 'Sao Paulo',    '',   'Brazil',         '-23.5505', '-46.6333',  '15', 'GG66', '', 'Brazil'),
  ('VE7PNW', 'Casey Lake',     '', 'Vancouver',    'BC', 'Canada',         '49.2827',  '-123.1207', '2',  'CN89', '', 'Canada'),
  ('9A1ZZ',  'Marko Horvat',   '', 'Zagreb',       '',   'Croatia',        '45.8150',  '15.9819',   '28', 'JN75', '', 'Croatia'),
  ('KH6PAC', 'Leilani Kona',   '', 'Honolulu',     'HI', 'United States',  '21.3069',  '-157.8583', '61', 'BL11', '', 'United States'),
  ('ZS6AFR', 'Thabo Nkosi',    '', 'Johannesburg', '',   'South Africa',   '-26.2041', '28.0473',   '57', 'KG33', '', 'South Africa'),
  ('LU1ARG', 'Diego Sosa',     '', 'Buenos Aires', '',   'Argentina',      '-34.6037', '-58.3816',  '14', 'GF05', '', 'Argentina'),
  ('OH2FIN', 'Aino Virtanen',  '', 'Helsinki',     '',   'Finland',        '60.1699',  '24.9384',   '18', 'KP20', '', 'Finland'),
  ('VU2IND', 'Arjun Rao',      '', 'Mumbai',       '',   'India',          '19.0760',  '72.8777',   '41', 'MK68', '', 'India');

-- QSOs (today is 2026-05-27; dates span >1 year to exercise every map time filter)
INSERT INTO `Contacts`
  (QSO_ID, user_id, QSO_Date, QSO_MTZTime, QSO_Callsign, QSO_Frequency, QSO_Notes, QSO_Received, QSO_Sent, qso_datetime_utc, frequency_mhz, mode, band)
VALUES
  (1,  1, '2026-05-27 00:00:00', '14:32', 'VE3XMP', '14.074',  'POTA hunt — great signal from the park.', '599', '599', '2026-05-27 14:32:00', 14.074000, 'FT8', '20m'),
  (2,  1, '2026-05-26 00:00:00', '21:05', 'G0TST',  '7.185',   'Nice ragchew about antennas.',            '59',  '57',  '2026-05-26 21:05:00', 7.185000,  'SSB', '40m'),
  (3,  1, '2026-05-24 00:00:00', '02:18', 'JA1EXM', '21.074',  '',                                        '599', '589', '2026-05-24 02:18:00', 21.074000, 'FT8', '15m'),
  (4,  1, '2026-05-20 00:00:00', '16:40', 'VK2SMP', '14.250',  'My activation — pile-up was wild!',       '59',  '59',  '2026-05-20 16:40:00', 14.250000, 'SSB', '20m'),
  (5,  1, '2026-05-10 00:00:00', '13:55', 'DL1DMO', '7.030',   'Park-to-park, both ends activating.',     '599', '599', '2026-05-10 13:55:00', 7.030000,  'CW',  '40m'),
  (6,  1, '2026-04-28 00:00:00', '23:12', 'EA4FOO', '3.573',   '',                                        '-08', '-12', '2026-04-28 23:12:00', 3.573000,  'FT8', '80m'),
  (7,  1, '2026-04-05 00:00:00', '18:22', 'W6MOK',  '28.400',  'Ten meters wide open today.',             '59',  '59',  '2026-04-05 18:22:00', 28.400000, 'SSB', '10m'),
  (8,  1, '2026-03-15 00:00:00', '15:08', 'K4FAK',  '146.520', 'Simplex on 2m FM.',                       '59',  '59',  '2026-03-15 15:08:00', 146.520000,'FM',  '2m'),
  (9,  1, '2026-02-01 00:00:00', '07:44', 'ZL1AOT', '21.300',  'Long path to New Zealand.',               '57',  '55',  '2026-02-01 07:44:00', 21.300000, 'SSB', '15m'),
  (10, 1, '2026-01-10 00:00:00', '11:30', 'PY2RIO', '14.074',  '',                                        '599', '599', '2026-01-10 11:30:00', 14.074000, 'FT8', '20m'),
  (11, 1, '2025-12-20 00:00:00', '19:50', 'VE7PNW', '18.100',  'Worked across the continent.',            '599', '579', '2025-12-20 19:50:00', 18.100000, 'CW',  '17m'),
  (12, 1, '2025-11-05 00:00:00', '20:15', '9A1ZZ',  '10.136',  '',                                        '599', '599', '2025-11-05 20:15:00', 10.136000, 'FT8', '30m'),
  (13, 1, '2025-09-15 00:00:00', '05:33', 'KH6PAC', '14.250',  'Aloha from Hawaii.',                      '58',  '57',  '2025-09-15 05:33:00', 14.250000, 'SSB', '20m'),
  (14, 1, '2025-07-04 00:00:00', '22:40', 'ZS6AFR', '7.030',   'Field Day weekend.',                      '599', '589', '2025-07-04 22:40:00', 7.030000,  'CW',  '40m'),
  (15, 1, '2025-06-10 00:00:00', '12:05', 'VE3XMP', '50.313',  'Six-meter sporadic-E opening.',           '599', '599', '2025-06-10 12:05:00', 50.313000, 'FT8', '6m'),
  (16, 1, '2024-12-25 00:00:00', '17:00', 'LU1ARG', '14.074',  'Holiday contact to Argentina.',           '599', '579', '2024-12-25 17:00:00', 14.074000, 'FT8', '20m'),
  (17, 1, '2024-08-15 00:00:00', '09:18', 'OH2FIN', '21.074',  '',                                        '599', '599', '2024-08-15 09:18:00', 21.074000, 'FT8', '15m'),
  (18, 1, '2023-05-20 00:00:00', '14:00', 'VU2IND', '14.250',  'First-ever contact with India.',          '55',  '54',  '2023-05-20 14:00:00', 14.250000, 'SSB', '20m');

-- POTA records (Type 1 = Hunter, Type 2 = Activator)
INSERT INTO `POTA_QSOs` (QSO_ID, POTAPark_ID, QSO_Type) VALUES
  (1, 'K-1234', '1'),  -- hunted an activator at K-1234
  (4, 'K-5678', '2'),  -- demo operator activating K-5678
  (5, 'K-1234', '1'),  -- park-to-park: we hunted K-1234 ...
  (5, 'K-9012', '2');  -- ... while activating K-9012

SET FOREIGN_KEY_CHECKS = 1;
