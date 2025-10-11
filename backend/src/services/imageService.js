import axios from 'axios';
import { Buffer } from 'buffer';

const POLLINATIONS_BASE_URL = 'https://image.pollinations.ai/prompt';

/**
 * Generates an image using Pollinations.ai based on a prompt.
 * @param {string} prompt The text prompt for image generation.
 * @returns {Promise<Buffer>} A promise that resolves to the image buffer.
 */
export async function generateImage(prompt) {
  // 1. Safely encode the prompt to be used in a URL.
  // This converts spaces to %20, handles special characters, etc.
  const encodedPrompt = encodeURIComponent(prompt);
  const imageUrl = `${POLLINATIONS_BASE_URL}/${encodedPrompt}`;

  console.log(`      - Calling Pollinations.ai for image...`);

  try {
    // 2. Make a GET request to the URL.
    // We expect the response to be raw image data, so we set 'arraybuffer'.
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });
    
    // 3. Convert the raw data into a Buffer, which is what Supabase Storage needs.
    console.log("      - ✅ Image received from Pollinations.ai.");
    return Buffer.from(response.data);

  } catch (error) {
    console.error("      - ❌ Error fetching image from Pollinations.ai:", error.message);
    throw new Error("Failed to generate image from Pollinations.ai.");
  }
}