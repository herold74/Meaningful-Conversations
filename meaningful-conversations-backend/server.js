const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import route handlers
const authRoutes = require('./routes/auth.js');
const dataRoutes = require('./routes/data.js');
const geminiRoutes = require('./routes/gemini.js');
const adminRoutes = require('./routes/admin.js');
const feedbackRoutes = require('./routes/feedback.js');
const botRoutes = require('./routes/bots.js');

const app = express();

// --- CORS Configuration ---
// Be more explicit with CORS options for production environments.
// This ensures that pre-flight 'OPTIONS' requests with custom headers like 'Authorization' are handled correctly.
const corsOptions = {
    origin: '*', // For production, you might want to restrict this to your frontend's actual domain.
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));


// Middleware to parse JSON request bodies
app.use(express.json({ limit: '5mb' })); // Increase limit for larger context files

// Register the route handlers
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/bots', botRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});