require('dotenv').config();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function classifyAndSave(message) {
  const prompt = `You are a city complaint classifier. Analyze the citizen's message and return ONLY valid JSON in this exact format:

{
  "category": "one of these only: Waste Management, Roads & Potholes, Streetlights, Water Supply",
  "location": "extracted location or 'No location mentioned'",
  "priority": "Low, Medium, or High"
}

Message: "${message}"`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up code blocks if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const classified = JSON.parse(text);

    // Insert the ticket and get back the inserted row
    const { data, error: insertError } = await supabase
      .from('tickets')
      .insert({
        citizen_message: message,
        category: classified.category,
        location: classified.location || "No location mentioned",
        priority: classified.priority,
        status: 'Open'
      })
      .select();

    if (insertError) {
      console.error("❌ Save failed:", insertError.message);
      return;
    }

    // Now count total tickets to generate proper ticket_id
    const { count, error: countError } = await supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.error("Count error:", countError.message);
      return;
    }

    const ticketNumber = count || 1;
    const ticket_id = `TKT-${String(ticketNumber).padStart(4, '0')}`;

    console.log("🎉 Ticket saved successfully!");
    console.log(`Ticket ID: ${ticket_id}`);
    console.log(`Category: ${classified.category}`);
    console.log(`Location: ${classified.location || "No location mentioned"}`);
    console.log(`Priority: ${classified.priority}\n`);

  } catch (err) {
    console.error("Error (Gemini or parsing):", err.message);
  }
}

// Test with real complaints
console.log("Saving test tickets...\n");

classifyAndSave("Big pothole on Main Road near the school, very dangerous!");
classifyAndSave("Garbage not collected for 5 days in Sector 9");
classifyAndSave("Streetlight not working outside house 123, Park Avenue");
classifyAndSave("No water supply since morning in Green Valley");

console.log("Done! Check your Supabase dashboard → Table Editor → tickets");