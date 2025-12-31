// Load environment variables
require('dotenv').config();

// Import Gemini
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Use a current stable fast model (as of Dec 2025)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function classifyComplaint(message) {
  const prompt = `
You are a helpful AI assistant for a city complaint system.
Classify the citizen's complaint into exactly one of these categories:
- Waste Management
- Roads & Potholes
- Streetlights
- Water Supply (we'll add more later)

Extract the location mentioned (or say "No location mentioned" if none).

Suggest priority: Low, Medium, or High (based on urgency/safety).

Respond ONLY in this JSON format (no extra text):

{
  "category": "Roads & Potholes",
  "location": "Sector 12 market",
  "priority": "High"
}

Citizen complaint: "${message}"
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Clean up the response (remove markdown if present)
  const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    const classified = JSON.parse(jsonText);
    console.log("Classified Complaint:");
    console.log(classified);
  } catch (error) {
    console.log("Raw response (parsing failed):");
    console.log(text);
  }
}

// Test with example complaints
console.log("Testing with examples...\n");

classifyComplaint("Streetlight not working near Sector 12 market")
  .catch(console.error);

classifyComplaint("There is a big pothole on MG Road, very dangerous!")
  .catch(console.error);

classifyComplaint("Garbage not collected for 3 days in Green Park area")
  .catch(console.error);

classifyComplaint("Water supply interrupted in my building at Civil Lines")
  .catch(console.error);