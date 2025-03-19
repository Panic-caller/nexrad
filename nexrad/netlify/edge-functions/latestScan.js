// netlify/edge-functions/latestScan.js

export default async (request, context) => {
  const { searchParams } = new URL(request.url);
  const site = searchParams.get("site");
  const date = searchParams.get("date"); // Expecting format: YYYYMMDD
  const time = searchParams.get("time"); // Expecting format: HHMM

  // Validate required query parameters.
  if (!site) {
    return new Response(
      JSON.stringify({ error: "Missing 'site' query parameter." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!date || !time) {
    return new Response(
      JSON.stringify({
        error:
          "Missing 'date' or 'time' query parameter. Provide date as YYYYMMDD and time as HHMM.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Construct the URL to fetch the raw NEXRAD file.
  const sourceUrl = `https://mesonet-nexrad.agron.iastate.edu/level2/raw/${site}/${site}_${date}_${time}`;

  try {
    // Fetch the raw data from the Iowa State Mesonet site.
    const response = await fetch(sourceUrl);

    if (!response.ok) {
      throw new Error(`Error fetching file. Status code: ${response.status}`);
    }

    // Read the response as an ArrayBuffer.
    const buffer = await response.arrayBuffer();

    // Convert the binary data to a base64 string.
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binary);

    // Return a JSON response that includes the base64-encoded data.
    return new Response(
      JSON.stringify({
        site,
        date,
        time,
        base64Data,
        message: "NEXRAD raw data returned in base64 encoding.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching NEXRAD data:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
