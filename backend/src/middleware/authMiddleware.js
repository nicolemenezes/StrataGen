// /backend/src/middleware/authMiddleware.js

import { expressjwt } from 'express-jwt';
import 'dotenv/config';

// Exporting a named constant
export const checkJwt = expressjwt({
  secret: process.env.SUPABASE_JWT_SECRET, // Use the shared secret from .env
  audience: 'authenticated',
  issuer: `${process.env.SUPABASE_URL}/auth/v1`,
  algorithms: ['HS256'] // <-- Change the algorithm to match the token
});