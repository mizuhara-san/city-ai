# city-ai
Roads, Wastes, And Streetlights

City AI – Smart Civic Complaint Portal
City AI Banner
An AI-powered civic grievance platform that makes cities cleaner, safer, and more responsive
Hackathon: GDG Hack2Skill 2026
Live Demo: https://city-ai.vercel.app/
Demo Video: Video 🔗: https://drive.google.com/file/d/1AUKlbOY3qHiEV2bS8oAmmpr3j1GEAfYR/view?usp=drivesdk 

🌟 Key Features

AI Agent with Visible Reasoning
Powered by Google Gemini – shows step-by-step thinking process for transparency
AI Photo Analysis (Vision)
Analyzes uploaded photos and adds concise 40–50 word description of severity, size, and risk
One-Tap GPS Location
Auto-captures accurate location, reverse geocodes address, auto-selects State & City
Full Indian Coverage
Complete dropdown with all states & thousands of cities/towns (alphabetically sorted)
Real-Time Department Dashboard
View, update status, assign teams, and dispatch with one click
Ticket Status Tracking
Citizens can check their complaint status using Ticket ID
Expanded Categories
Waste Management | Roads & Potholes | Streetlights | Water Supply | Animal Deaths | Accidents | Road Blockage
100% Free & Open Source
No paid APIs required for core functionality
Mobile-First & Responsive
Works seamlessly on phones and desktops


🚀 Tech Stack





































LayerTechnologyFrontend HTML5, CSS3, JavaScript, Leaflet (OpenStreetMap) BackendNode.js + Express Database Supabase (PostgreSQL) AIGoogle Gemini 2.5 Flash (Text + Vision) File Upload Multer MapsLeaflet + OpenStreetMap (Free) Deployment Vercel (Free tier)
















Mobile ViewAI Agent Thinking ProcessDepartment DashboardMobileAI ThinkingDashboard

🛠️ Local Setup

Clone the repositoryBashgit clone https://github.com/mizuhara-san/city-ai
cd city-ai
Install dependenciesBashnpm install
Create .env file in rootenvGEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
Download cities.js
Place this file in the /public folder:
https://raw.githubusercontent.com/ajayrandhawa/Indian-States-Cities-Database/master/cities.js
Run the appBashnode server.js
Open in browserhttp://localhost:3000


🔧 Supabase Table Schema (tickets)







































































ColumnType Description Nullable idbigint Auto-increment IDNo ticket_id texte.g., TKT-0019 Yescitizen_message textFull complaint textNocategory textAI-classified categoryNo location textAddress from GPS/manualNoprioritytextLow / Medium / HighNostatustextOpen / In Progress / ResolvedNo photo_base64 text Base64-encoded image Yesphoto_analysis textAI-generated photo description Yes created_at timestampAuto-generatedNo
Enable Row Level Security (RLS) and allow public insert/select/update as needed.

🚀 Deployment (Free Options)

Render.com (Recommended – free web service)
Vercel or Railway.app

Steps:

Push code to GitHub
Connect repo to Render
Set build command: npm install
Start command: node server.js
Add environment variables


🤝 Contributing
Feel free to contribute!

Add new categories
Improve UI/UX
Add multilingual support (Hindi, regional languages)
Integrate WhatsApp/SMS notifications
Add analytics for departments


Our Team:
Rohith
Tazeem
Balu
Yeswanth

GDG Hack2Skill 2026 Participant
Making cities smarter, one complaint at a time.

#CivicTech #AIforGood #SmartCities #Hack2Skill #OpenSource #India
⭐ Star this repo if you found it useful!
Feel free to fork, deploy, and use it for your city!
Let's build better cities together 🇮🇳🏙️🤖
