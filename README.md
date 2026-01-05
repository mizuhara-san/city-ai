# city-ai
Roads, Wastes, And Streetlights

City AI – Smart Civic Complaint Portal
City AI Banner
An AI-powered civic grievance platform that makes cities cleaner, safer, and more responsive
Hackathon: GDG Hack2Skill 2026
Live Demo: (Deployed URL here after deployment)
Demo Video: (YouTube/Drive link here)

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





































LayerTechnologyFrontendHTML5, CSS3, JavaScript, Leaflet (OpenStreetMap)BackendNode.js + ExpressDatabaseSupabase (PostgreSQL)AIGoogle Gemini 2.5 Flash (Text + Vision)File UploadMulterMapsLeaflet + OpenStreetMap (Free)DeploymentRender.com / Vercel (Free tier)

📱 Screenshots
(Replace with your actual screenshots after taking them)















Mobile ViewAI Agent Thinking ProcessDepartment DashboardMobileAI ThinkingDashboard

🛠️ Local Setup

Clone the repositoryBashgit clone https://github.com/[your-username]/city-ai.git
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







































































ColumnTypeDescriptionNullableidbigintAuto-increment IDNoticket_idtexte.g., TKT-0019Yescitizen_messagetextFull complaint textNocategorytextAI-classified categoryNolocationtextAddress from GPS/manualNoprioritytextLow / Medium / HighNostatustextOpen / In Progress / ResolvedNophoto_base64textBase64-encoded imageYesphoto_analysistextAI-generated photo descriptionYescreated_attimestampAuto-generatedNo
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


👨‍💻 Author
[Your Name]
GDG Hack2Skill 2026 Participant
Making cities smarter, one complaint at a time.

#CivicTech #AIforGood #SmartCities #Hack2Skill #OpenSource #India
⭐ Star this repo if you found it useful!
Feel free to fork, deploy, and use it for your city!
Let's build better cities together 🇮🇳🏙️🤖
