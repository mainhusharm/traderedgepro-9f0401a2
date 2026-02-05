 require('dotenv').config();
 const express = require('express');
 const cors = require('cors');
 
 const app = express();
 const PORT = process.env.PORT || 3000;
 
 // Supabase configuration
 const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gsmfjghxwebasmmxqlsi.supabase.co';
 const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
 
 if (!SUPABASE_ANON_KEY) {
   console.error('WARNING: SUPABASE_ANON_KEY not configured. Set it in environment variables.');
 }
 
 // CORS configuration - allow all origins for flexibility
 const corsOptions = {
   origin: function (origin, callback) {
     // Allow requests with no origin (mobile apps, curl, etc.)
     if (!origin) return callback(null, true);
     
     const allowedOrigins = [
       'https://traderedgepro.com',
       'https://www.traderedgepro.com',
       'https://traderedgepro-9f0401a2.onrender.com',
       'http://localhost:8080',
       'http://localhost:5173',
       'http://localhost:3000'
     ];
     
     // Allow lovable domains
     if (origin.includes('.lovable.app') || 
         origin.includes('.lovableproject.com') ||
         origin.includes('.lovable.dev')) {
       return callback(null, true);
     }
     
     if (allowedOrigins.includes(origin)) {
       return callback(null, true);
     }
     
     // In production, be more permissive
     if (process.env.NODE_ENV === 'production') {
       return callback(null, true);
     }
     
     callback(null, true);
   },
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
   allowedHeaders: [
     'Content-Type',
     'Authorization',
     'x-admin-session',
     'x-agent-session',
     'x-manager-session',
     'x-client-session',
     'x-supabase-client-platform',
     'x-supabase-client-platform-version',
     'x-supabase-client-runtime',
     'x-supabase-client-runtime-version',
     'x-client-info',
     'apikey'
   ],
   credentials: true,
   optionsSuccessStatus: 200
 };
 
 app.use(cors(corsOptions));
 app.use(express.json({ limit: '50mb' }));
 app.use(express.urlencoded({ extended: true, limit: '50mb' }));
 
 // Request logging middleware
 app.use((req, res, next) => {
   console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
   next();
 });
 
 // Extract all custom headers for forwarding to Supabase
 function extractCustomHeaders(req) {
   const headers = {};
   const forwardHeaders = [
     'authorization',
     'x-admin-session',
     'x-agent-session', 
     'x-manager-session',
     'x-client-session',
     'x-supabase-client-platform',
     'x-supabase-client-platform-version',
     'x-supabase-client-runtime',
     'x-supabase-client-runtime-version',
     'x-client-info'
   ];
   
   forwardHeaders.forEach(header => {
     if (req.headers[header]) {
       headers[header] = req.headers[header];
     }
   });
   
   return headers;
 }
 
 // Proxy function to forward requests to Supabase Edge Functions
 async function proxyToSupabase(functionName, body, customHeaders = {}) {
   const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
   
   const headers = {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
     'apikey': SUPABASE_ANON_KEY,
     ...customHeaders
   };
   
   console.log(`Proxying to: ${url}`);
   
   const response = await fetch(url, {
     method: 'POST',
     headers,
     body: JSON.stringify(body)
   });
   
   const contentType = response.headers.get('content-type');
   let data;
   
   if (contentType && contentType.includes('application/json')) {
     data = await response.json();
   } else {
     const text = await response.text();
     try {
       data = JSON.parse(text);
     } catch {
       data = { message: text };
     }
   }
   
   return { data, status: response.status, headers: response.headers };
 }
 
 // Health check endpoint
 app.get('/health', (req, res) => {
   res.json({ 
     status: 'ok', 
     timestamp: new Date().toISOString(),
     supabaseUrl: SUPABASE_URL,
     version: '1.0.0'
   });
 });
 
 app.get('/', (req, res) => {
   res.json({ 
     message: 'TraderEdgePro API Server',
     status: 'running',
     endpoints: {
       health: '/health',
       functions: '/api/functions/:functionName',
       auth: '/api/auth/*'
     }
   });
 });
 
 // ==================== AUTH ENDPOINTS ====================
 
 // User OTP endpoints
 app.post('/api/auth/send-otp', async (req, res) => {
   try {
     const { data, status } = await proxyToSupabase('send-otp', req.body, extractCustomHeaders(req));
     res.status(status).json(data);
   } catch (error) {
     console.error('Send OTP error:', error);
     res.status(500).json({ error: 'Failed to send OTP', details: error.message });
   }
 });
 
 app.post('/api/auth/verify-otp', async (req, res) => {
   try {
     const { data, status } = await proxyToSupabase('verify-otp', req.body, extractCustomHeaders(req));
     res.status(status).json(data);
   } catch (error) {
     console.error('Verify OTP error:', error);
     res.status(500).json({ error: 'Failed to verify OTP', details: error.message });
   }
 });
 
 // Admin auth endpoints
 app.post('/api/auth/validate-admin-access', async (req, res) => {
   try {
     const { data, status } = await proxyToSupabase('validate-admin-access', req.body, extractCustomHeaders(req));
     res.status(status).json(data);
   } catch (error) {
     console.error('Validate admin access error:', error);
     res.status(500).json({ error: 'Failed to validate admin access', details: error.message });
   }
 });
 
 // Agent auth endpoints
 app.post('/api/auth/agent-send-otp', async (req, res) => {
   try {
     const { data, status } = await proxyToSupabase('agent-send-otp', req.body, extractCustomHeaders(req));
     res.status(status).json(data);
   } catch (error) {
     console.error('Agent send OTP error:', error);
     res.status(500).json({ error: 'Failed to send OTP', details: error.message });
   }
 });
 
 app.post('/api/auth/agent-verify-otp', async (req, res) => {
   try {
     const { data, status } = await proxyToSupabase('agent-verify-otp', req.body, extractCustomHeaders(req));
     res.status(status).json(data);
   } catch (error) {
     console.error('Agent verify OTP error:', error);
     res.status(500).json({ error: 'Failed to verify OTP', details: error.message });
   }
 });
 
 app.post('/api/auth/validate-agent-session', async (req, res) => {
   try {
     const { data, status } = await proxyToSupabase('validate-agent-session', req.body, extractCustomHeaders(req));
     res.status(status).json(data);
   } catch (error) {
     console.error('Validate agent session error:', error);
     res.status(500).json({ error: 'Failed to validate session', details: error.message });
   }
 });
 
 // Manager auth endpoints
 app.post('/api/auth/manager-send-otp', async (req, res) => {
   try {
     const { data, status } = await proxyToSupabase('manager-send-otp', req.body, extractCustomHeaders(req));
     res.status(status).json(data);
   } catch (error) {
     console.error('Manager send OTP error:', error);
     res.status(500).json({ error: 'Failed to send OTP', details: error.message });
   }
 });
 
 app.post('/api/auth/manager-verify-otp', async (req, res) => {
   try {
     const { data, status } = await proxyToSupabase('manager-verify-otp', req.body, extractCustomHeaders(req));
     res.status(status).json(data);
   } catch (error) {
     console.error('Manager verify OTP error:', error);
     res.status(500).json({ error: 'Failed to verify OTP', details: error.message });
   }
 });
 
 // Client auth endpoints
 app.post('/api/auth/client-send-otp', async (req, res) => {
   try {
     const { data, status } = await proxyToSupabase('client-send-otp', req.body, extractCustomHeaders(req));
     res.status(status).json(data);
   } catch (error) {
     console.error('Client send OTP error:', error);
     res.status(500).json({ error: 'Failed to send OTP', details: error.message });
   }
 });
 
 app.post('/api/auth/client-verify-otp', async (req, res) => {
   try {
     const { data, status } = await proxyToSupabase('client-verify-otp', req.body, extractCustomHeaders(req));
     res.status(status).json(data);
   } catch (error) {
     console.error('Client verify OTP error:', error);
     res.status(500).json({ error: 'Failed to verify OTP', details: error.message });
   }
 });
 
 // Marketing auth endpoint
 app.post('/api/auth/validate-marketing-access', async (req, res) => {
   try {
     const { data, status } = await proxyToSupabase('validate-marketing-access', req.body, extractCustomHeaders(req));
     res.status(status).json(data);
   } catch (error) {
     console.error('Validate marketing access error:', error);
     res.status(500).json({ error: 'Failed to validate access', details: error.message });
   }
 });
 
 // ==================== API ENDPOINTS ====================
 
 // Admin API endpoint
 app.post('/api/admin', async (req, res) => {
   try {
     const { data, status } = await proxyToSupabase('admin-api', req.body, extractCustomHeaders(req));
     res.status(status).json(data);
   } catch (error) {
     console.error('Admin API error:', error);
     res.status(500).json({ error: 'Admin API error', details: error.message });
   }
 });
 
 // Manager API endpoint
 app.post('/api/manager', async (req, res) => {
   try {
     const { data, status } = await proxyToSupabase('manager-api', req.body, extractCustomHeaders(req));
     res.status(status).json(data);
   } catch (error) {
     console.error('Manager API error:', error);
     res.status(500).json({ error: 'Manager API error', details: error.message });
   }
 });
 
 // Accountant API endpoint
 app.post('/api/accountant', async (req, res) => {
   try {
     const { data, status } = await proxyToSupabase('accountant-api', req.body, extractCustomHeaders(req));
     res.status(status).json(data);
   } catch (error) {
     console.error('Accountant API error:', error);
     res.status(500).json({ error: 'Accountant API error', details: error.message });
   }
 });
 
 // ==================== GENERIC FUNCTION PROXY ====================
 
 // Generic edge function proxy - handles all other edge functions
 app.post('/api/functions/:functionName', async (req, res) => {
   try {
     const { functionName } = req.params;
     console.log(`Calling edge function: ${functionName}`);
     
     const { data, status } = await proxyToSupabase(functionName, req.body, extractCustomHeaders(req));
     res.status(status).json(data);
   } catch (error) {
     console.error(`Function ${req.params.functionName} error:`, error);
     res.status(500).json({ error: 'Function execution failed', details: error.message });
   }
 });
 
 // Also support GET requests for some functions
 app.get('/api/functions/:functionName', async (req, res) => {
   try {
     const { functionName } = req.params;
     const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
     
     const response = await fetch(url, {
       method: 'GET',
       headers: {
         'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
         'apikey': SUPABASE_ANON_KEY,
         ...extractCustomHeaders(req)
       }
     });
     
     const data = await response.json();
     res.status(response.status).json(data);
   } catch (error) {
     console.error(`Function GET ${req.params.functionName} error:`, error);
     res.status(500).json({ error: 'Function execution failed', details: error.message });
   }
 });
 
 // ==================== ERROR HANDLING ====================
 
 // 404 handler
 app.use((req, res) => {
   res.status(404).json({ 
     error: 'Not Found', 
     message: `Route ${req.method} ${req.path} not found`,
     availableEndpoints: [
       'GET /health',
       'POST /api/auth/*',
       'POST /api/admin',
       'POST /api/manager',
       'POST /api/accountant',
       'POST /api/functions/:functionName'
     ]
   });
 });
 
 // Global error handler
 app.use((err, req, res, next) => {
   console.error('Unhandled error:', err);
   res.status(500).json({ 
     error: 'Internal Server Error', 
     details: process.env.NODE_ENV === 'development' ? err.message : undefined 
   });
 });
 
 // ==================== START SERVER ====================
 
 app.listen(PORT, '0.0.0.0', () => {
   console.log(`
 ==========================================
  TraderEdgePro Backend Server
 ==========================================
  Port: ${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  Supabase URL: ${SUPABASE_URL}
  Health Check: http://localhost:${PORT}/health
 ==========================================
   `);
 });