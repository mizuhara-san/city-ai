require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Multer for photo upload
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Email transporter (for team notifications)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Submit complaint (same as before)
app.post('/submit-complaint', upload.single('photo'), async (req, res) => {
  let message = req.body.complaint;
  let photoBase64 = null;
  let photoDataUrl = null;

  if (!message || message.trim() === "") {
    return res.send("<h2>Please enter a complaint!</h2><a href='/'>Go back</a>");
  }

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

    let classified;
    try {
      classified = JSON.parse(text);
    } catch (parseErr) {
      console.error("JSON parse failed, using fallback");
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
        photo_base64: photoBase64
      })
      .select();

    if (insertError) throw insertError;

    // Generate ticket_id
    const { count, error: countError } = await supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true });

    if (countError) throw countError;

    const ticket_id = `TKT-${String(count || 1).padStart(4, '0')}`;

    // Save ticket_id
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

// Dashboard - shows all tickets with update options
app.get('/dashboard', async (req, res) => {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    let ticketList = '';
    if (tickets.length === 0) {
      ticketList = '<p style="text-align:center; color:gray; font-size:1.2em;">No complaints yet.</p>';
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
            <h3 style="color:#2c3e50;">Ticket ID: ${ticket.ticket_id}</h3>
            <p><strong>Status:</strong> ${ticket.status}</p>
            <p><strong>Category:</strong> ${ticket.category}</p>
            <p><strong>Location:</strong> ${ticket.location}</p>
            <p><strong>Priority:</strong> ${ticket.priority}</p>
            <p><strong>Assigned Team:</strong> ${ticket.assigned_team || 'Not assigned'}</p>
            <p><strong>Submitted:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
            <p><strong>Description:</strong><br>${ticket.citizen_message.replace(/\n/g, '<br>')}</p>
            ${analysisHtml}
            ${photoHtml}
            <div style="margin-top:20px;">
              <form action="/update-ticket" method="POST">
                <input type="hidden" name="ticket_id" value="${ticket.ticket_id}">
                <select name="status" style="padding:8px; border-radius:5px; margin-right:10px;">
                  <option value="${ticket.status}" selected>${ticket.status}</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
                <select name="assigned_team" style="padding:8px; border-radius:5px; margin-right:10px;">
                  <option value="${ticket.assigned_team || ''}" selected>${ticket.assigned_team || 'Assign Team'}</option>
                  <option value="Team A">Team A</option>
                  <option value="Team B">Team B</option>
                  <option value="Road Crew">Road Crew</option>
                  <option value="Animal Control">Animal Control</option>
                </select>
                <button type="submit" style="background:#27ae60; color:white; padding:8px 16px; border:none; border-radius:5px;">Update & Dispatch</button>
              </form>
            </div>
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
          .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 15px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          h1 { text-align: center; color: #2c3e50; }
          .logout { text-align: right; margin-bottom: 20px; }
          .logout a { background: #e74c3c; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; }
          .tickets { margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logout">
            <a href="/">Logout</a>
          </div>
          <h1>Department Dashboard</h1>
          <p style="text-align:center; font-size:1.2em; color:#555;">All Citizen Complaints</p>
          <div class="tickets">
            ${ticketList}
          </div>
          <div style="text-align:center; margin-top:40px;">
            <a href="/" style="background:#3498db; color:white; padding:12px 24px; border-radius:8px; text-decoration:none;">Back to Home</a>
          </div>
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    console.error("Dashboard error:", err);
    res.send(`
      <h2 style="color:red; text-align:center;">Error Loading Dashboard</h2>
      <p>Check server logs.</p>
      <a href="/">Back to Home</a>
    `);
  }
});

// Update ticket status and assign team
app.post('/update-ticket', async (req, res) => {
  const { ticket_id, status, assigned_team } = req.body;

  console.log("Update request for:", ticket_id, status, assigned_team); // Debug

  if (!ticket_id) {
    return res.send(`
      <h2 style="color:red;">Error: No Ticket ID</h2>
      <a href="/dashboard">Back to Dashboard</a>
    `);
  }

  try {
    const { error } = await supabase
      .from('tickets')
      .update({ 
        status: status,
        assigned_team: assigned_team || null
      })
      .eq('ticket_id', ticket_id);

    if (error) {
      console.error("Supabase update error:", error);
      return res.send(`
        <h2 style="color:red;">Update Failed</h2>
        <p>Error: ${error.message}</p>
        <a href="/dashboard">Back to Dashboard</a>
      `);
    }

    // Success — Supabase returns data: null on successful update
    res.send(`
      <h2 style="color:green; text-align:center;">Ticket Updated Successfully!</h2>
      <p>Ticket ${ticket_id} updated.</p>
      <p><strong>New Status:</strong> ${status}</p>
      <p><strong>Assigned Team:</strong> ${assigned_team || 'None'}</p>
      <a href="/dashboard">← Back to Dashboard</a>
    `);

  } catch (err) {
    console.error("Unexpected error:", err);
    res.send(`
      <h2 style="color:red;">Unexpected Error</h2>
      <p>${err.message}</p>
      <a href="/dashboard">Back</a>
    `);
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