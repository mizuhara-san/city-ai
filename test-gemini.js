// Load environment variables from .env file
require('dotenv').config();

// Import the Gemini library
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Get the API key
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("Error: GEMINI_API_KEY not found! Check your .env file.");
  process.exit(1);
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
async function testGemini() {
  const prompt = "Say hello and confirm you're ready for our City AI prototype!";

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  console.log("Gemini says:");
  console.log(text);
}

testGemini().catch(console.error);