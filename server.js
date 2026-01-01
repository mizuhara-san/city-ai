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

// Multer - memory storage for photos
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini
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

// Submit complaint (with optional photo)
app.post('/submit-complaint', upload.single('photo'), async (req, res) => {
  const message = req.body.complaint;
  let photoBase64 = null;
  let photoDataUrl = null;

  if (!message || message.trim() === "") {
    return res.send("<h2>Please enter a complaint!</h2><a href='/'>Go back</a>");
  }

  // Safe photo handling - completely optional
  if (req.file) {
    photoBase64 = req.file.buffer.toString('base64');
    photoDataUrl = `data:${req.file.mimetype};base64,${photoBase64}`;
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
    let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

    // Parse JSON with fallback
    let classified;
    try {
      classified = JSON.parse(text);
    } catch (parseErr) {
      console.error("JSON parse error, using fallback:", parseErr);
      classified = {
        category: "Roads & Potholes",
        location: "No location mentioned",
        priority: "Medium"
      };
    }

    // Insert ticket
    const { data: insertedData, error: insertError } = await supabase
      .from('tickets')
      .insert({
        citizen_message: message,
        category: classified.category,
        location: classified.location || "No location mentioned",
        priority: classified.priority,
        status: 'Open',
        photo_base64: photoBase64  // can be null
      })
      .select();

    if (insertError) throw insertError;

    // Generate ticket_id
    const { count, error: countError } = await supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true });

    if (countError) throw countError;

    const ticket_id = `TKT-${String(count || 1).padStart(4, '0')}`;

    // Update row with ticket_id
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ ticket_id: ticket_id })
      .eq('id', insertedData[0].id);

    if (updateError) throw updateError;

    // Success page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complaint Submitted</title>
        <style>
          body { font-family: 'Poppins', sans-serif; background: #f0f4f8; text-align: center; padding: 50px; }
          .card { max-width: 700px; margin: 0 auto; background: white; border-radius: 15px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          h1 { color: #27ae60; }
          .photo { max-width: 100%; max-height: 400px; border-radius: 10px; margin: 20px 0; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
          a { display: inline-block; margin-top: 30px; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 8px; }
          a:hover { background: #2980b9; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Thank You! Your Complaint is Registered</h1>
          <p><strong>Ticket ID:</strong> ${ticket_id}</p>
          <p><strong>Category:</strong> ${classified.category}</p>
          <p><strong>Location:</strong> ${classified.location || "No location mentioned"}</p>
          <p><strong>Priority:</strong> ${classified.priority}</p>
          ${photoDataUrl ? `<img src="${photoDataUrl}" alt="Uploaded photo" class="photo">` : '<p><em>No photo attached (optional)</em></p>'}
          <br>
          <a href="/">Submit Another Complaint</a>
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    console.error("Full error:", err);
    res.send(`
      <h2 style="color:red; text-align:center;">Error Processing Complaint</h2>
      <p>Details: ${err.message || "Unknown error (check server logs)"}</p>
      <p><a href="/">Try Again</a></p>
    `);
  }
});

// Simple demo login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'city123') {
    res.send(`
      <div style="text-align:center; margin-top:100px;">
        <h1 style="color:green;">Login Successful! 🎉</h1>
        <p>Welcome, Department Official</p>
        <a href="/dashboard" style="font-size:1.2em; padding:10px 20px; background:#3498db; color:white; text-decoration:none; border-radius:5px;">Go to Dashboard →</a>
        <br><br><a href="/">← Back to Home</a>
      </div>
    `);
  } else {
    res.send(`
      <div style="text-align:center; margin-top:100px;">
        <h1 style="color:red;">Invalid Credentials</h1>
        <a href="/">← Try Again</a>
      </div>
    `);
  }
});

app.get('/dashboard', (req, res) => {
  res.send(`
    <div style="max-width:1000px; margin:40px auto; padding:40px; background:white; border-radius:15px; box-shadow:0 10px 30px rgba(0,0,0,0.1); text-align:center;">
      <h1 style="color:#2c3e50;">Department Dashboard</h1>
      <p style="font-size:1.2em;">View and manage all citizen complaints</p>
      <p style="color:gray; margin-top:30px;">Real-time ticket list coming soon!</p>
      <a href="/">← Back to Home</a>
    </div>
  `);
});

// API for ticket status check
app.get('/api/ticket-status', async (req, res) => {
  const ticketId = req.query.ticketId;

  if (!ticketId) {
    return res.json({ error: "No ticket ID provided" });
  }

  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('ticket_id', ticketId)
      .single();

    if (error || !data) {
      res.json({ error: "Ticket not found" });
    } else {
      res.json(data);
    }
  } catch (err) {
    res.json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`City AI Portal is running!`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});