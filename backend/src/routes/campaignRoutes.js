// /backend/src/routes/campaignRoutes.js
import express from 'express';
import campaignController from '../controllers/campaignController.js';
import checkJwt from '../middleware/authMiddleware.js'; // 👈 Import the middleware

const router = express.Router();

// Apply the middleware to all routes in this file
// Any request to these endpoints MUST have a valid JWT.
router.use(checkJwt);

// Define your protected routes
router.post('/strategize', campaignController.createStrategy);
router.post('/:id/refine-strategy', campaignController.refineStrategy);
router.post('/:id/generate-assets', campaignController.generateAssets);
router.get('/:id', campaignController.getCampaignData);

// You can also apply it to individual routes like this:
// router.post('/strategize', checkJwt, campaignController.createStrategy);

export default router;