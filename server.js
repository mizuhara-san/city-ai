require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Multer for photo upload
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini (use current stable model that supports vision)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Submit complaint with AI agent + photo analysis
app.post('/submit-complaint', upload.single('photo'), async (req, res) => {
  let message = req.body.complaint;
  let photoBase64 = null;
  let photoDataUrl = null;
  let photoAnalysis = '';
  let agentThinking = [];

  if (!message || message.trim() === "") {
    return res.send("<h2>Please enter a complaint!</h2><a href='/'>Go back</a>");
  }

  agentThinking.push("🤖 AI Agent activated...");
  agentThinking.push("📝 Reading complaint: " + message.substring(0, 100) + "...");

  // Optional photo upload + AI analysis
  if (req.file) {
    photoBase64 = req.file.buffer.toString('base64');
    photoDataUrl = `data:${req.file.mimetype};base64,${photoBase64}`;

    try {
      agentThinking.push("📸 Analyzing uploaded photo with Gemini Vision...");

      const imagePart = {
        inlineData: {
          data: photoBase64,
          mimeType: req.file.mimetype
        }
      };

      const analysisPrompt = "Analyze this image for a city complaint. Provide a clear, concise description in 40-50 words only. Focus on the visible problem, size, condition, and safety risk. No extra commentary.";

      const analysisResult = await model.generateContent([analysisPrompt, imagePart]);
      const analysisResponse = await analysisResult.response;
      photoAnalysis = analysisResponse.text().trim();

      // Enforce word limit
      const words = photoAnalysis.split(' ');
      if (words.length > 50) {
        photoAnalysis = words.slice(0, 50).join(' ') + '...';
      }

      agentThinking.push("✅ Photo analysis complete (40-50 words)");

      message = `${message}\n\nAI Photo Analysis: ${photoAnalysis}`;
    } catch (analysisErr) {
      console.error("Photo analysis error:", analysisErr);
      photoAnalysis = 'AI photo analysis unavailable';
      agentThinking.push("⚠️ Photo analysis failed");
    }
  }

  try {
    agentThinking.push("🧠 Classifying complaint with Gemini AI...");

    const prompt = `You are an intelligent AI agent for city complaints.
Think step by step and respond in this JSON format only:

{
  "thinking": ["step 1", "step 2", "step 3"],
  "category": "Waste Management" or "Roads & Potholes" or "Streetlights" or "Water Supply" or "Animal Deaths" or "Accidents" or "Road Blockage",
  "location": "extracted location",
  "priority": "Low", "Medium", or "High",
  "summary": "short summary"
}

Complaint: "${message}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

    let classified;
    try {
      classified = JSON.parse(text);
      agentThinking = agentThinking.concat(classified.thinking || ["Analysis complete"]);
    } catch (e) {
      agentThinking.push("⚠️ AI response unclear, using safe defaults");
      classified = {
        category: "Roads & Potholes",
        location: "No location mentioned",
        priority: "Medium",
        summary: message.substring(0, 100),
        thinking: ["Used fallback classification"]
      };
    }

    agentThinking.push("💾 Saving to database...");

    const { data: insertedData, error: insertError } = await supabase
      .from('tickets')
      .insert({
        citizen_message: message,
        category: classified.category,
        location: classified.location,
        priority: classified.priority,
        status: 'Open',
        photo_base64: photoBase64,
        photo_analysis: photoAnalysis
      })
      .select();

    if (insertError) throw insertError;

    const { count } = await supabase.from('tickets').select('id', { count: 'exact', head: true });
    const ticket_id = `TKT-${String(count || 1).padStart(4, '0')}`;

    await supabase.from('tickets').update({ ticket_id }).eq('id', insertedData[0].id);

    agentThinking.push(`✅ Ticket created: ${ticket_id}`);

    // Success page with AI agent thinking
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complaint Submitted</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Poppins', sans-serif; background: #f0f4f8; padding: 20px; }
          .card { max-width: 800px; margin: 0 auto; background: white; border-radius: 15px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          h1 { color: #27ae60; text-align: center; }
          .agent-trace { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .step { margin: 8px 0; padding: 12px; background: #e9ecef; border-left: 5px solid #3498db; border-radius: 8px; }
          .photo { max-width: 100%; max-height: 400px; border-radius: 10px; margin: 20px 0; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
          a { display: block; text-align: center; margin-top: 30px; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 8px; width: fit-content; margin-left: auto; margin-right: auto; }
          a:hover { background: #2980b9; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🎉 Complaint Registered Successfully!</h1>
          <p><strong>Ticket ID:</strong> ${ticket_id}</p>
          <p><strong>Category:</strong> ${classified.category}</p>
          <p><strong>Location:</strong> ${classified.location}</p>
          <p><strong>Priority:</strong> ${classified.priority}</p>
          <p><strong>Summary:</strong> ${classified.summary}</p>

          ${photoDataUrl ? `<img src="${photoDataUrl}" alt="Evidence" class="photo">` : '<p><em>No photo attached</em></p>'}

          ${photoAnalysis ? `
          <div style="background:#e8f5e8; padding:15px; border-radius:10px; margin:20px 0;">
            <strong>AI Photo Analysis (40-50 words):</strong><br>${photoAnalysis}
          </div>
          ` : ''}

          <div class="agent-trace">
            <h3>🤖 AI Agent Thinking Process</h3>
            ${agentThinking.map(step => `<div class="step">${step}</div>`).join('')}
          </div>

          <a href="/">Submit Another Complaint</a>
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    console.error("Full error:", err);
    res.send(`
      <h2 style="color:red;">Error Processing Complaint</h2>
      <p>Details: ${err.message}</p>
      <a href="/">Try Again</a>
    `);
  }
});

// Department Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'city123') {
    res.send(`
      <div style="text-align:center; margin-top:100px; font-family: 'Poppins', sans-serif;">
        <h1 style="color:green;">Login Successful! 🎉</h1>
        <p>Welcome, Department Official</p>
        <a href="/dashboard" style="font-size:1.2em; padding:12px 24px; background:#3498db; color:white; text-decoration:none; border-radius:8px;">Go to Dashboard →</a>
        <br><br><a href="/">← Back to Home</a>
      </div>
    `);
  } else {
    res.send(`
      <div style="text-align:center; margin-top:100px; font-family: 'Poppins', sans-serif;">
        <h1 style="color:red;">Invalid Credentials</h1>
        <a href="/">← Try Again</a>
      </div>
    `);
  }
});

// Dashboard - shows all tickets
app.get('/dashboard', async (req, res) => {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    let ticketList = '';
    if (tickets.length === 0) {
      ticketList = '<p style="text-align:center; color:gray;">No complaints yet.</p>';
    } else {
      tickets.forEach(ticket => {
        const photoHtml = ticket.photo_base64 
          ? `<img src="data:image/jpeg;base64,${ticket.photo_base64}" style="max-width:100%; border-radius:10px; margin-top:10px;" alt="Photo">`
          : '<p><em>No photo</em></p>';

        const analysisHtml = ticket.photo_analysis 
          ? `<div style="background:#e8f5e8; padding:10px; border-radius:8px; margin-top:10px;"><strong>AI Photo Analysis:</strong> ${ticket.photo_analysis}</div>`
          : '';

        ticketList += `
          <div style="background:#f8f9fa; border-radius:10px; padding:20px; margin-bottom:20px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
            <h3>Ticket ID: ${ticket.ticket_id || 'N/A'}</h3>
            <p><strong>Status:</strong> ${ticket.status}</p>
            <p><strong>Category:</strong> ${ticket.category}</p>
            <p><strong>Location:</strong> ${ticket.location}</p>
            <p><strong>Priority:</strong> ${ticket.priority}</p>
            <p><strong>Submitted:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
            <p><strong>Description:</strong><br>${ticket.citizen_message.replace(/\n/g, '<br>')}</p>
            ${analysisHtml}
            ${photoHtml}
          </div>
        `;
      });
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Department Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Poppins', sans-serif; background: #f0f4f8; padding: 40px; }
          .container { max-width: 1000px; margin: 0 auto; background: white; border-radius: 15px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          h1 { text-align: center; color: #2c3e50; }
          .logout { text-align: right; margin-bottom: 20px; }
          .logout a { background: #e74c3c; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logout">
            <a href="/">Logout</a>
          </div>
          <h1>Department Dashboard</h1>
          <p style="text-align:center;">All Citizen Complaints</p>
          <div style="margin-top:30px;">
            ${ticketList}
          </div>
          <div style="text-align:center; margin-top:40px;">
            <a href="/">Back to Home</a>
          </div>
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    console.error("Dashboard error:", err);
    res.send(`<h2>Error</h2><a href="/">Back</a>`);
  }
});

// Ticket Status API
app.get('/api/ticket-status', async (req, res) => {
  const ticketId = req.query.ticketId;

  if (!ticketId) return res.json({ error: "No ticket ID" });

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('ticket_id', ticketId)
    .single();

  if (error || !data) res.json({ error: "Not found" });
  else res.json(data);
});

app.listen(PORT, () => {
  console.log(`City AI Portal running on http://localhost:${PORT}`);
});