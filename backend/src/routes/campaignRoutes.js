// /backend/src/routes/campaignRoutes.js

const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const checkJwt = require('../middleware/authMiddleware'); // 👈 Import the middleware

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

module.exports = router;