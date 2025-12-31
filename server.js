require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // for HTML/CSS files

// Initialize Gemini and Supabase
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Home page - the complaint form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle form submission
app.post('/submit-complaint', async (req, res) => {
  const message = req.body.complaint;

  if (!message || message.trim() === "") {
    return res.send("<h2>Please enter a complaint!</h2><a href='/'>Go back</a>");
  }

  try {
    const prompt = `Classify this citizen complaint and return ONLY valid JSON:

Categories: "Waste Management", "Roads & Potholes", "Streetlights", "Water Supply"

{
  "category": "chosen category",
  "location": "extracted location or 'No location mentioned'",
  "priority": "Low", "Medium", or "High"
}

Complaint: "${message}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const classified = JSON.parse(text);

    // Save to Supabase
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        citizen_message: message,
        category: classified.category,
        location: classified.location || "No location mentioned",
        priority: classified.priority,
        status: 'Open'
      })
      .select();

    if (error) throw error;

    // Get total count for ticket ID
    const { count } = await supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true });

    const ticket_id = `TKT-${String(count || 1).padStart(4, '0')}`;

    // Success page
    res.send(`
      <h1 style="text-align:center; color:green; margin-top:100px;">Thank You!</h1>
      <h2 style="text-align:center;">Your complaint has been registered.</h2>
      <div style="text-align:center; font-size:1.5em; margin:30px;">
        <strong>Ticket ID:</strong> ${ticket_id}<br><br>
        <strong>Category:</strong> ${classified.category}<br>
        <strong>Location:</strong> ${classified.location || "No location mentioned"}<br>
        <strong>Priority:</strong> ${classified.priority}
      </div>
      <p style="text-align:center;">
        <a href="/">Submit another complaint</a>
      </p>
    `);

  } catch (err) {
    console.error("Error:", err.message);
    if (err.message.includes("quota")) {
      res.send("<h2>Sorry, daily AI limit reached. Try again tomorrow!</h2><a href='/'>Back</a>");
    } else {
      res.send("<h2>Error processing complaint. Try again.</h2><a href='/'>Back</a>");
    }
  }
});

app.listen(PORT, () => {
  console.log(`City AI is running!`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});