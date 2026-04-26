const { GoogleGenAI } = require('@google/genai');

/**
 * Get the Google GenAI client instance
 */
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY is not defined in environment variables.');
  }
  
  // Initialize the Google Gen AI client
  // It automatically picks up GEMINI_API_KEY from process.env if apiKey is not explicitly provided,
  // but we can pass it explicitly.
  return new GoogleGenAI(apiKey ? { apiKey } : {});
};

/**
 * Generate text using Google AI Studio (Gemini)
 * @param {string} prompt - The prompt to send to the model
 * @returns {Promise<string>} The generated text response
 */
const generateText = async (prompt) => {
  try {
    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Error generating content with Google AI Studio:', error);
    throw error;
  }
};

module.exports = {
  getGenAIClient,
  generateText,
};
