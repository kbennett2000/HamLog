// Copy & paste into QRZ console window

const callsignsToLookup = [
  "XX1X",
];

function parseHamRadioDetails(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  let details = {
    callsign: "",
    name: "",
    nickname: "",
    address: "",
    country: "",
    latitude: "",
    longitude: "",
    gridSquare: "",
  };

  // Extract callsign
  const callsignElement = doc.querySelector(".csignm.hamcall");
  details.callsign = callsignElement
    ? callsignElement.textContent
    : "Not found";

  // Extract name and nickname
  let name = "Not found",
    nickname = "Not found";
  const nameElements = doc.querySelectorAll("p.m0 span");
  if (nameElements.length) {
    name = nameElements[0].textContent;
    const nicknameElement = Array.from(nameElements).find((el) =>
      el.textContent.includes('"')
    );
    nickname = nicknameElement
      ? nicknameElement.textContent.replace(/["]+/g, "").trim()
      : "Not found";
  }

  // Extract address and country
  const pInfoElement = doc.querySelector("p.m0");
  let address = "Not found",
    country = "Not found";
  if (pInfoElement) {
    const brElements = pInfoElement.querySelectorAll("br");
    if (brElements.length >= 2) {
      address = brElements[brElements.length - 3].nextSibling.textContent.trim() + " " + brElements[brElements.length - 2].nextSibling.textContent.trim();
      country = brElements[brElements.length - 1].nextSibling.textContent.trim();
    }
  }

  // Use replace with a function to capture the removed part
  name = name.replace(/"\s*([^"]+)\s*"/, function (match, group1) {
    nickname = group1; // Store the captured group (nickname) in Y
    return ""; // Return an empty string to remove the nickname from X
  });

  name = name.replace(/\s+/g, " ");
  details.name = name;
  details.nickname = nickname;
  details.address = address;
  details.country = country;
  details.latitude = findValueAfterTd(doc, "Latitude");
  details.longitude = findValueAfterTd(doc, "Longitude");
  details.gridSquare = findValueAfterTd(doc, "Grid Square");

  const returnValue =
    details.callsign +
    "***" +
    details.name +
    "***" +
    details.nickname +
    "***" +
    details.address +
    "***" +
    details.country +
    "***" +
    details.gridSquare +
    "***" +
    details.latitude +
    "***" +
    details.longitude;

  console.log(returnValue);

  return returnValue;
}

function findValueAfterTd(doc, text) {
  const tds = doc.querySelectorAll("td.dh");
  for (let i = 0; i < tds.length; i++) {
    if (tds[i].textContent.trim() === text) {
      const nextSibling = tds[i].nextElementSibling;
      if (nextSibling) {
        return nextSibling.textContent.trim();
      }
      break;
    }
  }
  return null; // Return null if not found
}

async function fetchHtmlContent(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const htmlContent = await response.text();
    return htmlContent;
  } catch (error) {
    console.error("Failed to fetch HTML content:", error);
    return null; // Return null or handle the error as appropriate
  }
}

function downloadFile(filename, content) {
  // Create a Blob with the content
  const blob = new Blob([content], { type: "text/plain" });

  // Create a link to download the blob
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  // Programmatically trigger the download
  document.body.appendChild(link);
  link.click();

  // Clean up by removing the link
  document.body.removeChild(link);
}

function pauseExecutionForTwoSeconds() {
  return new Promise((resolve) => setTimeout(resolve, 3000));
}

async function GetInfo(CallSign) {
  const url = `https://www.qrz.com/db/${CallSign}`; // Replace with the actual URL you wish to fetch content from
  fetchHtmlContent(url).then((htmlContent) => {
    if (htmlContent) {
      // Call the parseAndExtract function with the fetched HTML content
      const theDetails = parseHamRadioDetails(htmlContent);
      // Example usage
      downloadFile(`${CallSign}.txt`, theDetails);
    } else {
      console.log("Failed to fetch or parse the HTML content.");
    }
  });
}

async function main() {
  for (const element of callsignsToLookup) {
    GetInfo(element);
    await pauseExecutionForTwoSeconds();
  }
}

main();
