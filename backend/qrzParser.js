// Copy & paste into QRZ console window

const callsignsToLookup = [
  "3G1B",
  "4A7T",
  "4U1A",
  "5W0LM",
  "7L4LKK",
  "9A0BB",
  "AC1PI",
  "AD8MP",
  "AD9BL",
  "AD9CC",
  "AE0LZ",
  "AE3NE",
  "AF4XL",
  "AG7FU",
  "AI5NQ",
  "AZ6H",
  "CA3VAK",
  "CB3R",
  "CE2YWW",
  "CE3LMO",
  "CE6CGX",
  "CO90IARU",
  "CR3DX",
  "D01KRT",
  "EA1DR",
  "EA8RM",
  "HH2AA",
  "HQ9A",
  "J62K",
  "K0PZH",
  "K2P",
  "K3KLB",
  "K3SDM",
  "K5OGR",
  "K7GDR",
  "K7HTM",
  "K8JOK",
  "K8REE",
  "KB4JOY",
  "KC1QDZ",
  "KC1RQH",
  "KC3SEG",
  "KC4BB", 
  "KD9QOB",
  "KD9SZN",
  "KD9TTB",
  "KD9VUW",
  "KD9WFF",
  "KD9YOD",
  "KE8OXZ",
  "KE8PZN",
  "KE8QLG",
  "KE8SZL",
  "KE8UJJ",
  "KE8UTX",
  "KE8VOL",
  "KE8YGW",
  "KE8YWM",
  "KF0CZD",
  "KF0NXT",
  "KF0NZH",
  "KI5MBO",
  "KI5RHS",
  "KI5RLZ",
  "KI5TXY",
  "KI5WWT",
  "KI5ZAZ",
  "KI5ZDQ",
  "KI5ZXD",
  "KJ5AJG",
  "KJ5BAW",
  "KJ7QPD",
  "KJ8MRH",
  "KK7BKH",
  "KK7CJV",
  "KK7GWX",
  "KK7MWI",
  "KK7NLA",
  "KL7DUG",
  "KM7TAM",
  "KN6GWT",
  "KO4GAR",
  "KO4NDP",
  "KO4SCS",
  "KO4VYT",
  "KO4ZRX",
  "KQ4CTD",
  "KQ4GPT",
  "KY4BX",
  "KY4KP",
  "KZ4BK",
  "LU1WCL",
  "LV8V",
  "MD3A",
  "N1O",
  "N1SPW",
  "N3DRK",
  "N3NIK",
  "N4LDB",
  "N5EST",
  "N5LNK",
  "N9DEK",
  "OA4DVC",
  "OK5D",
  "PP4T",
  "PP5EI",
  "PU1MHZ",
  "PU2YZP",
  "PV2G",
  "PV2K",
  "PZ5CO",
  "PZ5W",
  "R4FBH",
  "RT0F",
  "TI1E",
  "TI2JS",
  "TI7W",
  "TO66R",
  "TO7K",
  "V31XT",
  "VA3DPZ",
  "VA3HES",
  "VA3MPJ",
  "VA3NPW",
  "VA5MUD",
  "VA7VZ",
  "VE3GKT",
  "VO1GRC",
  "W0CBP",
  "W0P/2",
  "W0YEM",
  "W0YKS",
  "W2T",
  "W4LMY",
  "W4WJE",
  "W5JBF",
  "W5LIC",
  "W5MVD",
  "W5O",
  "W5R",
  "W6E",
  "W6G",
  "W6T",
  "W6TPB",
  "W7ATP",
  "W7GNM",
  "W9BDX",
  "W9CPL",
  "W9GOT",
  "WA7FLY",
  "WB4JIM",
  "WB9EWJ",
  "WD5JR",
  "WD6UCK",
  "WV4AS",
  "YB6BXN",
  "YV1KK",
  "YV4CEG",
  "YY4TSS",
  "ZF2B",
  "ZS6CYY",
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
    main(element);
    await pauseExecutionForTwoSeconds();
  }
}

main();