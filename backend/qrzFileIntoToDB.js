// USE:
// Run qrzParser in browser console first, then...
// node qrzFileIntoDB.js > sqlQueries.sql
// Run sqlQueries in MySQL DB

const fs = require('fs');
const path = require('path');
const sqlQueries = [];

// Specify the path to the qrzData directory
const dirPath = path.join(__dirname, 'qrzData');

// Read the directory for file names
fs.readdir(dirPath, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  // Process each file in the directory
  files.forEach(file => {
    const filePath = path.join(dirPath, file);

    // Read each file asynchronously
    fs.readFile(filePath, { encoding: 'utf8' }, (err, data) => {
      if (err) {
        console.error(`Error reading file: ${file}`, err);
        return;
      }

      // Split the data by comma (with no spaces around it) to get the elements
      // Regular expression used: /(?<!\s),(?!\s)/
      //const elements = data.split(/(?<!\s),(?!\s)/);
      const elements = data.split('***');

      // Assuming each file contains exactly 8 elements as specified
      if (elements.length === 8) {
        const [callsign, name, nickname, address, country, gridSquare, latitude, longitude] = elements;

        // Create an object to store the parsed elements
        const parsedData = {
          callsign: callsign.trim(),
          name: name.trim(),
          nickname: nickname.trim(),
          address: address.trim(),
          country: country.trim(),
          gridSquare: gridSquare.trim(),
          latitude: latitude.replace(/\(.*?\)/g, '').trim(),
          longitude: longitude.replace(/\(.*?\)/g, '').trim()
        };

        // Log or process the parsed data from each file
        //console.log(parsedData);
        
        const callSignFromFilename = file.replace('/home/agoric/Desktop/The Lab/sha256/qrzData/', '').replace('.txt', '');

        let sqlQuery = "";
        if (latitude !== 'null' && longitude !== 'null' && gridSquare !== 'null') {
            sqlQuery = `UPDATE HamLogDB.ContactInfo SET ContactInfo_Name = '${parsedData.name}', ContactInfo_Street = '${parsedData.address}', ContactInfo_AddressCountry = '${parsedData.country}', ContactInfo_Latitude = '${parsedData.latitude}', ContactInfo_Longitude = '${parsedData.longitude}', ContactInfo_GridSquare = '${parsedData.gridSquare}', ContactInfo_Country = '${parsedData.country}' WHERE ContactInfo_Callsign = '${callSignFromFilename}';`;
        } else if (latitude !== 'null' && longitude !== 'null' && gridSquare === 'null') {
            sqlQuery = `UPDATE HamLogDB.ContactInfo SET ContactInfo_Name = '${parsedData.name}', ContactInfo_Street = '${parsedData.address}', ContactInfo_AddressCountry = '${parsedData.country}', ContactInfo_Latitude = '${parsedData.latitude}', ContactInfo_Longitude = '${parsedData.longitude}', ContactInfo_Country = '${parsedData.country}' WHERE ContactInfo_Callsign = '${callSignFromFilename}';`;
        } else if (latitude === 'null' && longitude === 'null' && gridSquare !== 'null') {
            sqlQuery = `UPDATE HamLogDB.ContactInfo SET ContactInfo_Name = '${parsedData.name}', ContactInfo_Street = '${parsedData.address}', ContactInfo_AddressCountry = '${parsedData.country}', ContactInfo_GridSquare = '${parsedData.gridSquare}', ContactInfo_Country = '${parsedData.country}' WHERE ContactInfo_Callsign = '${callSignFromFilename}';`;
        } else if (latitude === 'null' && longitude === 'null' && gridSquare === 'null') { 
            sqlQuery = `UPDATE HamLogDB.ContactInfo SET ContactInfo_Name = '${parsedData.name}', ContactInfo_Street = '${parsedData.address}', ContactInfo_AddressCountry = '${parsedData.country}', ContactInfo_Country = '${parsedData.country}' WHERE ContactInfo_Callsign = '${callSignFromFilename}';`;
        }

        console.log(sqlQuery);

        //sqlQueries.push(sqlQuery);

      } else {
        console.error(`Unexpected number of elements in file: ${file}.`);
      }
    });
  });

  //console.log(sqlQueries);

});
