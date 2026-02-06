 # TraderEdgePro Backend
 
 Express.js backend server that proxies requests to Supabase Edge Functions.
 
 ## Deployment on Render
 
 ### Environment Variables
 
 Set these in your Render dashboard:
 
 | Variable | Value |
 |----------|-------|
 | `NODE_ENV` | `production` |
 | `PORT` | `10000` (Render assigns this) |
 | `SUPABASE_URL` | `https://toiisjwejwookuqihbmo.supabase.co` |
 | `SUPABASE_ANON_KEY` | Your Supabase anon key |
 
 ### Build Settings
 
 - **Root Directory**: `backend`
 - **Build Command**: `npm install`
 - **Start Command**: `node server.js`
 - **Health Check Path**: `/health`
 
 ## API Endpoints
 
 ### Health Check
 - `GET /health` - Returns server status
 
 ### Authentication
 - `POST /api/auth/send-otp` - Send OTP to user
 - `POST /api/auth/verify-otp` - Verify OTP
 - `POST /api/auth/validate-admin-access` - Validate admin credentials
 - `POST /api/auth/agent-send-otp` - Send OTP to agent
 - `POST /api/auth/agent-verify-otp` - Verify agent OTP
 - `POST /api/auth/validate-agent-session` - Validate agent session
 - `POST /api/auth/manager-send-otp` - Send OTP to manager
 - `POST /api/auth/manager-verify-otp` - Verify manager OTP
 - `POST /api/auth/client-send-otp` - Send OTP to client
 - `POST /api/auth/client-verify-otp` - Verify client OTP
 - `POST /api/auth/validate-marketing-access` - Validate marketing MPIN
 
 ### API Endpoints
 - `POST /api/admin` - Admin API calls
 - `POST /api/manager` - Manager API calls
 - `POST /api/accountant` - Accountant API calls
 
 ### Generic Edge Function Proxy
 - `POST /api/functions/:functionName` - Proxy any edge function
 - `GET /api/functions/:functionName` - GET request to edge function
 
 ## Local Development
 
 ```bash
 cd backend
 npm install
 npm start
 ```
 
 Server runs on `http://localhost:3000`