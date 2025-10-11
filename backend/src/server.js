require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Configure this more securely in production!
app.use(express.json()); // To parse JSON request bodies

// A simple test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is healthy and running!' });
});

// TODO: Add campaign routes here
// const campaignRoutes = require('./routes/campaignRoutes');
// app.use('/api/campaigns', campaignRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});