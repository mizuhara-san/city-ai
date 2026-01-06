require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

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

// Helper to get current citizen user
async function getCurrentUser(req) {
  const token = req.cookies.supabase_token;
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Citizen Register
app.post('/citizen-register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Successful</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Poppins', sans-serif; background: #f0f4f8; display: flex; justify-content: center; align-items: center; height: 100vh; }
          .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 15px 40px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
          h2 { color: #27ae60; }
          a { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #3498db; color: white; border-radius: 50px; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Registration Successful!</h2>
          <p>Please check your email for confirmation.</p>
          <a href="/">Back to Home</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Registration Error</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Poppins', sans-serif; background: #f0f4f8; display: flex; justify-content: center; align-items: center; height: 100vh; }
          .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 15px 40px rgba(0,0,0,0.1); text-align: center; }
          h2 { color: #e74c3c; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Registration Failed</h2>
          <p>${err.message || 'Unknown error'}</p>
          <a href="/">Try Again</a>
        </div>
      </body>
      </html>
    `);
  }
});

// Citizen Login
app.post('/citizen-login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    res.cookie('supabase_token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    res.redirect('/');
  } catch (err) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Login Error</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Poppins', sans-serif; background: #f0f4f8; display: flex; justify-content: center; align-items: center; height: 100vh; }
          .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 15px 40px rgba(0,0,0,0.1); text-align: center; }
          h2 { color: #e74c3c; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Login Failed</h2>
          <p>${err.message || 'Unknown error'}</p>
          <a href="/">Try Again</a>
        </div>
      </body>
      </html>
    `);
  }
});

// Citizen Logout
app.get('/citizen-logout', (req, res) => {
  res.clearCookie('supabase_token');
  res.redirect('/');
});

// My Complaints Page
app.get('/my-complaints', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.redirect('/');
  }

  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  let ticketList = '';
  if (!tickets || tickets.length === 0) {
    ticketList = '<p style="text-align:center; color:#999; font-size:1.2em;">No complaints submitted yet.</p>';
  } else {
    tickets.forEach(ticket => {
      const photoHtml = ticket.photo_base64 
        ? `<img src="data:image/jpeg;base64,${ticket.photo_base64}" style="max-width:100%; border-radius:10px; margin-top:10px;" alt="Evidence">`
        : '<p><em>No photo attached</em></p>';

      const analysisHtml = ticket.photo_analysis 
        ? `<div style="background:#e8f5e8; padding:10px; border-radius:8px; margin-top:10px;"><strong>AI Photo Analysis:</strong> ${ticket.photo_analysis}</div>`
        : '';

      let priorityColor = ticket.priority === 'High' ? '#e74c3c' : (ticket.priority === 'Medium' ? '#f39c12' : '#27ae60');

      let progressPercent = 0;
      let progressColor = '#e74c3c';
      if (ticket.status === 'In Progress') {
        progressPercent = 60;
        progressColor = '#f39c12';
      } else if (ticket.status === 'Resolved') {
        progressPercent = 100;
        progressColor = '#27ae60';
      }

      const mapsLink = ticket.lat && ticket.lng 
        ? `https://www.google.com/maps/search/?api=1&query=${ticket.lat},${ticket.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticket.location)}`;

      ticketList += `
        <div style="background:#f8f9fa; border-radius:15px; padding:25px; margin-bottom:30px; box-shadow:0 6px 20px rgba(0,0,0,0.08);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="color:#2c3e50; margin:0;">Ticket ID: ${ticket.ticket_id}</h3>
            <span style="background:${priorityColor}; color:white; padding:6px 15px; border-radius:50px; font-weight:bold;">${ticket.priority} Priority</span>
          </div>
          <p><strong>Status:</strong> <span style="color:${progressColor}; font-weight:bold;">${ticket.status}</span></p>
          <p><strong>Category:</strong> ${ticket.category}</p>
          <p><strong>Location:</strong> ${ticket.location} <a href="${mapsLink}" target="_blank" style="color:#3498db; text-decoration:none;">(View on Maps →)</a></p>
          <p><strong>Submitted:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>

          <div style="margin:20px 0;">
            <p><strong>Progress:</strong></p>
            <div style="width:100%; background:#ddd; border-radius:10px; overflow:hidden;">
              <div style="width:${progressPercent}%; height:25px; background:${progressColor}; transition:width 0.8s ease;"></div>
            </div>
            <p style="text-align:right; margin-top:5px; color:#555;">${progressPercent}% Complete</p>
          </div>

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
      <title>My Complaints</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Poppins', sans-serif; background: #f0f4f8; padding: 40px; }
        .container { max-width: 900px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 15px 40px rgba(0,0,0,0.1); }
        h1 { text-align: center; color: #2c3e50; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>My Complaints</h1>
          <div>
            <span style="color:#27ae60; font-weight:bold;">Welcome, ${user.email}</span>
            <a href="/citizen-logout" style="margin-left:20px; background:#e74c3c; color:white; padding:10px 20px; border-radius:50px; text-decoration:none;">Logout</a>
          </div>
        </div>
        ${ticketList}
        <div style="text-align:center; margin-top:40px;">
          <a href="/" style="background:#3498db; color:white; padding:12px 24px; border-radius:50px; text-decoration:none;">Back to Home</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Submit complaint with user linking
app.post('/submit-complaint', upload.single('photo'), async (req, res) => {
  const { complaint, lat, lng, state, location_city } = req.body;
  let message = complaint;
  let photoBase64 = null;
  let photoDataUrl = null;
  let photoAnalysis = '';
  let agentThinking = [];

  if (!message || message.trim() === "") {
    return res.send("<h2>Please enter a complaint!</h2><a href='/'>Go back</a>");
  }

  agentThinking.push("🤖 AI Agent activated...");
  agentThinking.push("📝 Reading complaint: " + message.substring(0, 100) + "...");

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

      const words = photoAnalysis.split(' ');
      if (words.length > 50) {
        photoAnalysis = words.slice(0, 50).join(' ') + '...';
      }

      agentThinking.push("✅ Photo analysis complete");
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

    const currentUser = await getCurrentUser(req);
    const user_id = currentUser ? currentUser.id : null;

    const location = classified.location || `${location_city || ''}, ${state || ''}`;

    const { data: insertedData, error: insertError } = await supabase
      .from('tickets')
      .insert({
        citizen_message: message,
        category: classified.category,
        location: location,
        priority: classified.priority,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        status: 'Open',
        photo_base64: photoBase64,
        photo_analysis: photoAnalysis,
        user_id: user_id
      })
      .select();

    if (insertError) throw insertError;

    const { count } = await supabase.from('tickets').select('id', { count: 'exact', head: true });
    const ticket_id = `TKT-${String(count || 1).padStart(4, '0')}`;

    await supabase.from('tickets').update({ ticket_id }).eq('id', insertedData[0].id);

    agentThinking.push(`✅ Ticket created: ${ticket_id}`);

    const priorityColor = classified.priority === 'High' ? '#e74c3c' : (classified.priority === 'Medium' ? '#f39c12' : '#27ae60');

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
          .priority-badge { display: inline-block; padding: 5px 15px; border-radius: 50px; color: white; font-weight: bold; margin-bottom: 10px; }
          a { display: block; text-align: center; margin-top: 30px; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 8px; width: fit-content; margin-left: auto; margin-right: auto; }
          a:hover { background: #2980b9; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🎉 Complaint Registered Successfully!</h1>
          <p><strong>Ticket ID:</strong> ${ticket_id}</p>
          <div class="priority-badge" style="background: ${priorityColor}">
            Priority: ${classified.priority}
          </div>
          <p><strong>Category:</strong> ${classified.category}</p>
          <p><strong>Location:</strong> ${location}</p>
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
          ${currentUser ? `<a href="/my-complaints" style="background:#f39c12; margin-top:10px;">View My Complaints</a>` : ''}
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
    res.redirect('/dashboard');
  } else {
    res.send("<h2 style='color:red; text-align:center;'>Invalid Credentials</h2><a href='/'>Try Again</a>");
  }
});

// Dashboard
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

        let priorityColor = ticket.priority === 'High' ? '#e74c3c' : (ticket.priority === 'Medium' ? '#f39c12' : '#27ae60');

        let progressPercent = 0;
        let progressColor = '#e74c3c';
        if (ticket.status === 'In Progress') {
          progressPercent = 60;
          progressColor = '#f39c12';
        } else if (ticket.status === 'Resolved') {
          progressPercent = 100;
          progressColor = '#27ae60';
        }

        const mapsLink = ticket.lat && ticket.lng 
          ? `https://www.google.com/maps/search/?api=1&query=${ticket.lat},${ticket.lng}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticket.location)}`;

        ticketList += `
          <div style="background:#f8f9fa; border-radius:15px; padding:25px; margin-bottom:30px; box-shadow:0 6px 20px rgba(0,0,0,0.08);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
              <h3 style="color:#2c3e50; margin:0;">Ticket ID: ${ticket.ticket_id}</h3>
              <span style="background:${priorityColor}; color:white; padding:6px 15px; border-radius:50px; font-weight:bold;">${ticket.priority} Priority</span>
            </div>
            <p><strong>Status:</strong> <span style="color:${progressColor}; font-weight:bold;">${ticket.status}</span></p>
            <p><strong>Category:</strong> ${ticket.category}</p>
            <p><strong>Location:</strong> ${ticket.location} <a href="${mapsLink}" target="_blank" style="color:#3498db; text-decoration:none;">(View on Maps →)</a></p>
            <p><strong>Assigned Team:</strong> <strong>${ticket.assigned_team || '<em style="color:#999;">Not assigned yet</em>'}</strong></p>
            <p><strong>Submitted:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>

            <div style="margin:20px 0;">
              <p><strong>Progress:</strong></p>
              <div style="width:100%; background:#ddd; border-radius:10px; overflow:hidden;">
                <div style="width:${progressPercent}%; height:25px; background:${progressColor}; transition:width 0.8s ease;"></div>
              </div>
              <p style="text-align:right; margin-top:5px; color:#555;">${progressPercent}% Complete</p>
            </div>

            <p><strong>Description:</strong><br>${ticket.citizen_message.replace(/\n/g, '<br>')}</p>
            ${analysisHtml}
            ${photoHtml}

            <div style="margin-top:25px; padding-top:20px; border-top:1px solid #eee;">
              <form action="/update-ticket" method="POST" style="display:flex; flex-wrap:wrap; gap:10px; align-items:center;">
                <input type="hidden" name="ticket_id" value="${ticket.ticket_id}">
                <select name="status" style="padding:10px; border-radius:8px; flex:1; min-width:150px;">
                  <option value="Open" ${ticket.status === 'Open' ? 'selected' : ''}>Open</option>
                  <option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                  <option value="Resolved" ${ticket.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                </select>
                <select name="assigned_team" style="padding:10px; border-radius:8px; flex:1; min-width:150px;">
                  <option value="">Assign Team</option>
                  <option value="Road Crew" ${ticket.assigned_team === 'Road Crew' ? 'selected' : ''}>Road Crew</option>
                  <option value="Waste Team" ${ticket.assigned_team === 'Waste Team' ? 'selected' : ''}>Waste Team</option>
                  <option value="Electrical Team" ${ticket.assigned_team === 'Electrical Team' ? 'selected' : ''}>Electrical Team</option>
                  <option value="Animal Control" ${ticket.assigned_team === 'Animal Control' ? 'selected' : ''}>Animal Control</option>
                  <option value="Traffic Police" ${ticket.assigned_team === 'Traffic Police' ? 'selected' : ''}>Traffic Police</option>
                </select>
                <button type="submit" style="background:#27ae60; color:white; padding:10px 20px; border:none; border-radius:8px; cursor:pointer;">Update & Dispatch</button>
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
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          body { font-family: 'Poppins', sans-serif; background: #f0f4f8; padding: 40px; }
          .container { max-width: 900px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 15px 40px rgba(0,0,0,0.1); }
          h1 { text-align: center; color: #2c3e50; }
          .logout { text-align: right; margin-bottom: 30px; }
          .logout a { background: #e74c3c; color: white; padding: 12px 24px; border-radius: 50px; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logout"><a href="/">Logout</a></div>
          <h1>Department Dashboard</h1>
          <p style="text-align:center; font-size:1.3em; color:#555; margin-bottom:40px;">Manage & Resolve Citizen Complaints</p>
          <div>${ticketList}</div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Dashboard error:", err);
    res.send("<h2>Error loading dashboard</h2><a href='/'>Back</a>");
  }
});

// Update ticket
app.post('/update-ticket', async (req, res) => {
  const { ticket_id, status, assigned_team } = req.body;
  try {
    const { error } = await supabase
      .from('tickets')
      .update({ status, assigned_team: assigned_team || null })
      .eq('ticket_id', ticket_id);

    if (error) throw error;
    res.redirect('/dashboard');
  } catch (err) {
    console.error("Update error:", err);
    res.send("<h2>Update failed</h2><a href='/dashboard'>Back</a>");
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
  console.log(`-----------------------------------------`);
  console.log(`🚀 City AI Portal is LIVE`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log(`-----------------------------------------`);
});