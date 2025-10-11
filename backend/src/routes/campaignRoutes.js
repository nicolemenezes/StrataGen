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

export default router;