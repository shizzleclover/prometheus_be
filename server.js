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
// Removed app.options('*', ...) due to Express 5 path-to-regexp change

app.use(express.json()); // Parse JSON requests
app.use(sanitizeRequest); // Prevent MongoDB operator injection (Express 5 safe)

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
