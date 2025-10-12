// /backend/src/routes/campaignRoutes.js

import express from 'express';
import * as campaignController from '../controllers/campaignController.js';
import { checkJwt } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes in this file with JWT validation
router.use(checkJwt);

// --- Core Strategy & Chat Flow ---
router.post('/strategize-and-chat', campaignController.createStrategyAndChat);
router.post('/:campaignId/chat', campaignController.continueChat);
router.get('/:campaignId/chat', campaignController.getChatHistory);
router.post('/:campaignId/approve', campaignController.approveStrategy);

// --- Data Fetching & Regeneration Flow ---
router.get('/:campaignId', campaignController.getCampaignData);

// Note: The specific regeneration endpoint for assets.
router.post('/assets/:assetId/regenerate', campaignController.regenerateAsset);

// ✅ NEW: Route for direct content updates (Feature 1)
router.put('/copies/:copyId', campaignController.updateCopyContent);

// ✅ NEW: Route for the AI command bar (Feature 2)
router.post('/:campaignId/command', campaignController.handleCommand);

export default router;