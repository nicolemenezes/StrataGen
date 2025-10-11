// /backend/src/middleware/authMiddleware.js

import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import 'dotenv/config';

// Exporting a named constant
export const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${process.env.SUPABASE_URL}/.well-known/jwks.json`,
  }),
  audience: 'authenticated',
  issuer: `${process.env.SUPABASE_URL}/auth/v1`,
  algorithms: ['RS256'],
});