require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sanitizeRequest } = require('./middleware/sanitize');
const helmet = require('helmet');
const connectDB = require('./config/database');

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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
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
