// /backend/src/services/serperService.js

import 'dotenv/config';

/**
 * Performs a Google search using the Serper API via a direct fetch call.
 * @param {string} query The search query.
 * @returns {Promise<object>} The organic search results from Serper.
 */
export async function searchInfluencers(query) {
  console.log(`      - Calling Serper.ai for query: "${query}"`);
  
  const url = 'https://google.serper.dev/search';
  
  const requestBody = JSON.stringify({
    q: query,
    gl: 'in' // Geolocation set to India for more relevant results
  });

  const options = {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.SERPER_API_KEY,
      'Content-Type': 'application/json'
    },
    body: requestBody
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      // If the response is not successful, read the error message from Serper
      const errorText = await response.text();
      throw new Error(`Serper API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("      - ✅ Received search results from Serper.ai.");
    
    return data.organic; // We only care about the organic search results

  } catch (error) {
    console.error("      - ❌ Error fetching from Serper.ai:", error.message);
    throw new Error("Failed to perform search with Serper.ai.");
  }
}