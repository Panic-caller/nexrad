// netlify/edge-functions/latestScan.js

export default async (request, context) => {
  // Parse the incoming URL for query parameters.
  const { searchParams } = new URL(request.url);
  const site = searchParams.get("site");
  const date = searchParams.get("date"); // Format: YYYYMMDD
  const time = searchParams.get("time"); // Format: HHMM

  // Validate that all required parameters are present.
  if (!site || !date || !time) {
    return new Response(
      JSON.stringify({
        error: "Missing required query parameters. Expecting 'site', 'date' (YYYYMMDD), and 'time' (HHMM)."
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  // Build the URL to the Iowa State Mesonet raw NEXRAD file.
  const sourceUrl = `https://mesonet-nexrad.agron.iastate.edu/level2/raw/${site}/${site}_${date}_${time}`;

  try {
    // Fetch the raw binary data from the source URL.
    const response = await fetch(sourceUrl);

    if (!response.ok) {
      throw new Error(`Error fetching file. Status code: ${response.status}`);
    }

    // Read the data as an ArrayBuffer.
    const buffer = await response.arrayBuffer();

    // Convert the binary data to a base64-encoded string.
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binary);

    // Return a JSON response with the base64-encoded data.
    return new Response(
      JSON.stringify({
        site,
        date,
        time,
        base64Data,
        message: "NEXRAD raw data returned in base64 encoding."
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in Edge Function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
