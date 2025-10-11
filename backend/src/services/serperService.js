import 'dotenv/config';
import serper from 'serper';

console.log('Type of serper import:', typeof serper); 
/**
 * Performs a Google search using the Serper API.
 * @param {string} query The search query.
 * @returns {Promise<object>} The organic search results from Serper.
 */
export async function searchInfluencers(query) {
  console.log(`      - Calling Serper.ai for query: "${query}"`);
  try {
    const options = {
      q: query,
      apiKey: process.env.SERPER_API_KEY,
    };
    const data = await serper(options);
    console.log("      - ✅ Received search results from Serper.ai.");
    return data.organic; // We only care about the organic search results
  } catch (error) {
    console.error("      - ❌ Error fetching from Serper.ai:", error.message);
    throw new Error("Failed to perform search with Serper.ai.");
  }
}