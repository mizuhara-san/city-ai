require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Multer for photo upload
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini (Using stable 1.5-flash model)
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
  // Extract coordinates and complaint from body
  const { complaint, lat, lng } = req.body; 
  
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

    const { data: insertedData, error: insertError } = await supabase
      .from('tickets')
      .insert({
        citizen_message: message,
        category: classified.category,
        location: classified.location,
        priority: classified.priority,
        lat: lat ? parseFloat(lat) : null, // Corrected to parseFloat
        lng: lng ? parseFloat(lng) : null, // Corrected to parseFloat
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

    // Success page (Preserved your original design with added Priority Badge)
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
          .priority-badge { display: inline-block; padding: 5px 15px; border-radius: 50px; color: white; font-weight: bold; font-size: 0.9em; margin-bottom: 10px; }
          a { display: block; text-align: center; margin-top: 30px; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 8px; width: fit-content; margin-left: auto; margin-right: auto; }
          a:hover { background: #2980b9; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🎉 Complaint Registered Successfully!</h1>
          <p><strong>Ticket ID:</strong> ${ticket_id}</p>
          <div class="priority-badge" style="background: ${classified.priority === 'High' ? '#e74c3c' : (classified.priority === 'Medium' ? '#f39c12' : '#27ae60')}">
            Priority: ${classified.priority}
          </div>
          <p><strong>Category:</strong> ${classified.category}</p>
          <p><strong>Location:</strong> ${classified.location}</p>
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

// Department Login (Upgraded to beautiful UI)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'city123') {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login Successful</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 100vh; display: flex; justify-content: center; align-items: center; color: #333; }
          .success-card { background: white; padding: 50px; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); text-align: center; max-width: 450px; width: 90%; animation: slideUp 0.6s ease-out; }
          @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          .icon-circle { width: 80px; height: 80px; background: #27ae60; color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 40px; margin: 0 auto 20px; animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s both; }
          @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
          h1 { color: #2d3436; margin-bottom: 10px; font-size: 24px; }
          p { color: #636e72; margin-bottom: 30px; }
          .btn-primary { display: inline-block; background: #3498db; color: white; padding: 14px 30px; border-radius: 50px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3); }
          .btn-primary:hover { transform: translateY(-3px); background: #2980b9; }
        </style>
      </head>
      <body>
        <div class="success-card">
          <div class="icon-circle"><i class="fas fa-check"></i></div>
          <h1>Login Successful!</h1>
          <p>Welcome back, Department Official. Your dashboard is ready.</p>
          <a href="/dashboard" class="btn-primary">Go to Dashboard <i class="fas fa-arrow-right" style="margin-left:8px;"></i></a>
        </div>
      </body>
      </html>
    `);
  } else {
    res.send("<h1 style='text-align:center; color:red;'>Invalid Credentials</h1><div style='text-align:center;'><a href='/'>Try Again</a></div>");
  }
});

// Dashboard - (Preserved original card structure + Priority Badge + Map Link)
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

        // Priority Badge Logic
        let priorityColor = ticket.priority === 'High' ? '#e74c3c' : (ticket.priority === 'Medium' ? '#f39c12' : '#27ae60');

        // Progress bar logic
        let progressPercent = 0;
        let progressColor = '#e74c3c';
        if (ticket.status === 'In Progress') {
          progressPercent = 60;
          progressColor = '#f39c12';
        } else if (ticket.status === 'Resolved') {
          progressPercent = 100;
          progressColor = '#27ae60';
        }

        // Google Maps link
        // FIXED: Using the standard Google Maps search URL format
      const mapsLink = ticket.lat && ticket.lng 
        ? `https://www.google.com/maps/search/?api=1&query=${ticket.lat},${ticket.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticket.location)}`;
        
        ticketList += `
          <div class="ticket-card" style="background:#f8f9fa; border-radius:15px; padding:25px; margin-bottom:30px; box-shadow:0 6px 20px rgba(0,0,0,0.08); text-align: left;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <h3 style="color:#2c3e50; margin: 0;">Ticket ID: ${ticket.ticket_id || 'N/A'}</h3>
              <span style="background:${priorityColor}; color:white; padding:6px 15px; border-radius:50px; font-size:0.85em; font-weight:bold;">
                Priority: ${ticket.priority}
              </span>
            </div>

            <p><strong>Status:</strong> <span style="font-weight:bold; color:${progressColor};">${ticket.status}</span></p>
            <p><strong>Category:</strong> ${ticket.category}</p>
            
            <div style="margin-bottom: 15px;">
              <p><strong>Location:</strong> ${ticket.location}</p>
              <a href="${mapsLink}" target="_blank" style="color:#3498db; text-decoration:none; font-weight:600; font-size: 0.9em;">
                <i class="fas fa-map-marker-alt"></i> View on Google Maps →
              </a>
            </div>

            <p><strong>Assigned Team:</strong> <strong>${ticket.assigned_team || '<em style="color:#999;">Not assigned yet</em>'}</strong></p>
            <p><strong>Submitted:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>

            <div style="margin:20px 0;">
              <p><strong>Progress:</strong></p>
              <div style="width:100%; background:#ddd; border-radius:10px; overflow:hidden;">
                <div style="width:${progressPercent}%; height:15px; background:${progressColor}; transition:width 0.8s ease;"></div>
              </div>
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
          h1 { text-align: center; color: #2c3e50; margin-bottom: 10px; }
          .logout { text-align: right; margin-bottom: 30px; }
          .logout a { background: #e74c3c; color: white; padding: 12px 24px; border-radius: 50px; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logout"><a href="/">Logout</a></div>
          <h1>Department Dashboard</h1>
          <p style="text-align:center; font-size:1.3em; color:#555; margin-bottom:40px;">Manage & Resolve Citizen Complaints</p>
          <div class="tickets">${ticketList}</div>
        </div>
      </body>
      </html>
    `);

  } catch (err) { res.status(500).send("Error loading dashboard"); }
});

// Update ticket status and assigned team
app.post('/update-ticket', async (req, res) => {
  const { ticket_id, status, assigned_team } = req.body;
  try {
    await supabase.from('tickets').update({ status, assigned_team: assigned_team || null }).eq('ticket_id', ticket_id);
    res.redirect('/dashboard');
  } catch (err) { res.status(500).send("Update failed"); }
});

// Ticket Status API
app.get('/api/ticket-status', async (req, res) => {
  const ticketId = req.query.ticketId;
  const { data, error } = await supabase.from('tickets').select('*').eq('ticket_id', ticketId).single();
  if (error || !data) res.json({ error: "Not found" });
  else res.json(data);
});

app.listen(PORT, () => {
  console.log(`-----------------------------------------`);
  console.log(`🚀 City AI Portal is LIVE`);
  console.log(`🔗 Local Link: http://localhost:${PORT}`);
  console.log(`-----------------------------------------`);
});