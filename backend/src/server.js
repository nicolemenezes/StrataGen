// /backend/src/server.js

import 'dotenv/config'; // Loads .env file contents into process.env
import express from 'express';
import cors from 'cors';
import campaignRoutes from './routes/campaignRoutes.js'; // 👈 Note the .js extension

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // TODO: Configure for production origins
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is healthy!' });
});

app.use('/api/campaigns', campaignRoutes);

// Global error handler (optional but good practice)
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    // Specific error from express-jwt
    res.status(401).json({ message: 'Invalid or missing token.' });
  } else {
    console.error(err.stack);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});