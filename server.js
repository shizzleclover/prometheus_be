require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sanitizeRequest } = require('./middleware/sanitize');
const helmet = require('helmet');
const connectDB = require('./config/database');

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please set these variables in your deployment environment.');
  process.exit(1);
}

// Import models to test they work
const User = require('./models/User');
const Conversation = require('./models/Conversation');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet()); // Basic security

// CORS: reflect request origin to allow all origins safely with credentials
const corsOptions = {
  origin: true, // Reflect the request origin
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

app.use(express.json()); // Parse JSON requests
app.use(sanitizeRequest); // Prevent MongoDB operator injection (Express 5 safe)

// Request/Response logging middleware (redacts sensitive fields)
(function attachLogging() {
  const MAX_LEN = 1000; // chars
  const SENSITIVE_KEYS = new Set(['password', 'hashedPassword', 'token', 'authorization']);

  function redact(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.slice(0, 50).map(redact); // limit array length
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        out[k] = '[REDACTED]';
      } else if (typeof v === 'object' && v !== null) {
        out[k] = redact(v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  function toLogString(data) {
    try {
      if (data === undefined) return '';
      if (Buffer.isBuffer(data)) return `[Buffer ${data.length}b]`;
      if (typeof data === 'string') return data.length > MAX_LEN ? data.slice(0, MAX_LEN) + '…' : data;
      const json = JSON.stringify(redact(data));
      return json.length > MAX_LEN ? json.slice(0, MAX_LEN) + '…' : json;
    } catch (_) {
      return '[Unserializable]';
    }
  }

  app.use((req, res, next) => {
    const start = Date.now();
    const reqInfo = `${req.method} ${req.originalUrl}`;
    const reqBodyStr = toLogString(req.body);

    const originalSend = res.send.bind(res);
    res.send = (body) => {
      const durationMs = Date.now() - start;
      const status = res.statusCode;
      const resBodyStr = toLogString(body);

      // Basic single-line summary
      console.log(`➡️  ${reqInfo} | status=${status} | ${durationMs}ms`);

      // Detailed bodies (only in development)
      if (process.env.NODE_ENV !== 'production') {
        if (reqBodyStr) console.log(`   ↳ req.body: ${reqBodyStr}`);
        if (resBodyStr) console.log(`   ↳ res.body: ${resBodyStr}`);
      }

      return originalSend(body);
    };

    next();
  });
})();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// Swagger docs
const openapiPath = path.join(__dirname, 'docs', 'openapi.json');
if (fs.existsSync(openapiPath)) {
  const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));
}

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Chatbot API is running',
    models: {
      User: User.modelName,
      Conversation: Conversation.modelName
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
