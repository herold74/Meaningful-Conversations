const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import route handlers
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const geminiRoutes = require('./routes/gemini');
const adminRoutes = require('./routes/admin'); // New admin routes

const app = express();

// Enable CORS for all routes, allowing requests from your frontend
app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json({ limit: '5mb' })); // Increase limit for larger context files

// Register the route handlers
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/admin', adminRoutes); // Register admin routes

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});