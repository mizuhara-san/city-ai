require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const { processComplaint } = require('./agents'); // AI Agent

const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Multer for photo upload (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Submit complaint - uses AI Agent
app.post('/submit-complaint', upload.single('photo'), async (req, res) => {
  const message = req.body.complaint;
  let photoBase64 = null;
  let photoDataUrl = null;

  if (!message || message.trim() === "") {
    return res.send("<h2>Please enter a complaint!</h2><a href='/'>Go back</a>");
  }

  // Handle optional photo
  if (req.file) {
    photoBase64 = req.file.buffer.toString('base64');
    photoDataUrl = `data:${req.file.mimetype};base64,${photoBase64}`;
  }

  try {
    // Call AI Agent
    const agentResult = await processComplaint(message);

    // If photo uploaded and ticket created successfully, save photo
    if (photoBase64 && agentResult.ticket_id && agentResult.ticket_id !== "ERROR") {
      const { error: photoError } = await supabase
        .from('tickets')
        .update({ photo_base64: photoBase64 })
        .eq('ticket_id', agentResult.ticket_id);

      if (photoError) console.error("Photo save error:", photoError);
    }

    // Success page with AI agent thinking trace
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
          .step { margin: 8px 0; padding: 12px; background: #e9ecef; border-left: 5px solid #3498db; border-radius: 8px; font-family: monospace; }
          .photo { max-width: 100%; max-height: 400px; border-radius: 10px; margin: 20px 0; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
          a { display: block; text-align: center; margin-top: 30px; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 8px; width: fit-content; margin-left: auto; margin-right: auto; }
          a:hover { background: #2980b9; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🎉 Complaint Registered Successfully!</h1>
          <p><strong>Ticket ID:</strong> ${agentResult.ticket_id || "Processing..."}</p>
          <p><strong>Category:</strong> ${agentResult.category}</p>
          <p><strong>Location:</strong> ${agentResult.location}</p>
          <p><strong>Priority:</strong> ${agentResult.priority}</p>
          ${agentResult.summary ? `<p><strong>Summary:</strong> ${agentResult.summary}</p>` : ''}

          ${photoDataUrl ? `<img src="${photoDataUrl}" alt="Evidence" class="photo">` : '<p><em>No photo attached (optional)</em></p>'}

          ${agentResult.agent_thinking ? `
          <div class="agent-trace">
            <h3>🤖 AI Agent Thinking Process</h3>
            ${agentResult.agent_thinking.map(step => `<div class="step">${step}</div>`).join('')}
          </div>
          ` : ''}

          <a href="/">Submit Another Complaint</a>
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    console.error("Agent integration error:", err);
    res.send(`
      <h2 style="color:red; text-align:center;">Agent Error</h2>
      <p>Please try again later.</p>
      <a href="/">Back to Home</a>
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

// Real Dashboard - shows all tickets
app.get('/dashboard', async (req, res) => {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    let ticketList = '';
    if (tickets.length === 0) {
      ticketList = '<p style="text-align:center; color:gray; font-size:1.2em;">No complaints submitted yet.</p>';
    } else {
      tickets.forEach(ticket => {
        const photoHtml = ticket.photo_base64 
          ? `<img src="data:image/jpeg;base64,${ticket.photo_base64}" style="max-width:100%; max-height:400px; border-radius:10px; margin-top:15px; box-shadow:0 4px 10px rgba(0,0,0,0.1);" alt="Complaint photo">`
          : '<p style="color:gray; font-style:italic;">No photo attached</p>';

        ticketList += `
          <div style="background:#f8f9fa; border-left:5px solid #3498db; border-radius:10px; padding:20px; margin-bottom:25px; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
            <h3 style="color:#2c3e50; margin-bottom:10px;">Ticket ID: ${ticket.ticket_id || 'Not assigned'}</h3>
            <p><strong>Status:</strong> <span style="color:#e67e22; font-weight:bold;">${ticket.status}</span></p>
            <p><strong>Category:</strong> ${ticket.category}</p>
            <p><strong>Location:</strong> ${ticket.location}</p>
            <p><strong>Priority:</strong> ${ticket.priority}</p>
            <p><strong>Submitted:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
            <p><strong>Description:</strong><br>${ticket.citizen_message.replace(/\n/g, '<br>')}</p>
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
          h1 { text-align: center; color: #2c3e50; margin-bottom: 10px; }
          .logout { text-align: right; margin-bottom: 30px; }
          .logout a { background: #e74c3c; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; }
          .tickets { margin-top: 20px; }
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
            <a href="/" style="padding:12px 24px; background:#3498db; color:white; border-radius:8px; text-decoration:none;">Back to Home</a>
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
      <a href="/">Back</a>
    `);
  }
});

// Ticket Status API
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
  console.log(`City AI Agent Portal is running!`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});