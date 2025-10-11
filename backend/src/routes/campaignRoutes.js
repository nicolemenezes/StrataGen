// /backend/src/routes/campaignRoutes.js

import express from 'express';
import * as campaignController from '../controllers/campaignController.js';
import { checkJwt } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes in this file with JWT validation
router.use(checkJwt);

// --- Core Strategy & Chat Flow ---

// Creates a new campaign AND gets the first AI response in one step.
router.post('/strategize-and-chat', campaignController.createStrategyAndChat);

// Continues an existing chat conversation.
router.post('/:campaignId/chat', campaignController.continueChat);

// Gets the chat history for a specific campaign.
router.get('/:campaignId/chat', campaignController.getChatHistory);

// Approves the final strategy and queues the orchestration tasks.
router.post('/:campaignId/approve', campaignController.approveStrategy);


// --- Data Fetching & Regeneration Flow ---

// Gets all data for a single campaign (details, tasks, assets, copies).
router.get('/:campaignId', campaignController.getCampaignData);

// Queues a regeneration task for a specific piece of content.
// Note: This route operates on a task ID, not a campaign ID.
router.post('/tasks/:taskId/regenerate', campaignController.regenerateAsset);


export default router;