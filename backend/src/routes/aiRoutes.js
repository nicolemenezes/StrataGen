import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generateCampaignStrategy } from '../controllers/aiController.js';

const router = Router();

router.use(protect);

router.post('/generate-campaign', generateCampaignStrategy);

export default router;