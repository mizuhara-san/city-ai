// agents.js - Visible AI Agent with Thinking Steps

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function processComplaint(message) {
  let thinkingSteps = [];

  thinkingSteps.push("🤖 AI Agent activated...");
  thinkingSteps.push("📝 Reading complaint: " + message.substring(0, 100) + "...");

    const prompt = `You are an intelligent AI agent for city complaints.
Think step by step and respond in this JSON format only:

{
  "thinking": ["step 1", "step 2", "step 3"],
  "category": "Waste Management" or "Roads & Potholes" or "Streetlights" or "Water Supply",
  "location": "extracted location",
  "priority": "Low", "Medium", or "High",
  "summary": "short summary"
}

Complaint: "${message}"`;

  try {
    thinkingSteps.push("🧠 Analyzing with Gemini AI...");

    const geminiResult = await model.generateContent(prompt);
    const response = await geminiResult.response;
    let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

    let classifiedData;
    try {
      classifiedData = JSON.parse(text);
      thinkingSteps = thinkingSteps.concat(classifiedData.thinking || ["Analysis complete"]);
    } catch (e) {
      thinkingSteps.push("⚠️ AI response unclear, using safe defaults");
      classifiedData = {
        category: "Roads & Potholes",
        location: "No location mentioned",
        priority: "Medium",
        summary: message.substring(0, 100),
        thinking: ["Used fallback classification"]
      };
      thinkingSteps.push("Fallback mode activated");
    }

    thinkingSteps.push("💾 Saving to database...");

    const { data: insertedData, error: insertError } = await supabase
      .from('tickets')
      .insert({
        citizen_message: message,
        category: classifiedData.category,
        location: classifiedData.location,
        priority: classifiedData.priority,
        status: 'Open'
      })
      .select();

    if (insertError) throw insertError;

    const { count } = await supabase.from('tickets').select('id', { count: 'exact', head: true });
    const ticket_id = `TKT-${String(count || 1).padStart(4, '0')}`;

    await supabase.from('tickets').update({ ticket_id }).eq('id', insertedData[0].id);

    thinkingSteps.push(`✅ Ticket created: ${ticket_id}`);

    return {
      ...classifiedData,
      ticket_id,
      agent_thinking: thinkingSteps
    };

  } catch (err) {
    console.error("Agent error:", err);
    return {
      category: "Error",
      location: "Agent failed",
      priority: "High",
      summary: "Please try again",
      ticket_id: "ERROR",
      agent_thinking: ["Agent error: " + err.message]
    };
  }
}

module.exports = { processComplaint };