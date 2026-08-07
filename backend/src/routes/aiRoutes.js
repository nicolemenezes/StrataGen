import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  generateCampaignStrategy,
  generateContent,
  generateImagePrompts,
  generateStrategy,
  refineCampaign,
} from '../controllers/aiController.js';
import { validateAiRequest } from '../middleware/aiValidationMiddleware.js';

const router = Router();

router.use(protect);

router.post('/generate-campaign', validateAiRequest, generateCampaignStrategy);
router.post('/generate-strategy', validateAiRequest, generateStrategy);
router.post('/generate-content', validateAiRequest, generateContent);
router.post('/generate-image-prompts', validateAiRequest, generateImagePrompts);
router.post('/refine-campaign', validateAiRequest, refineCampaign);

export default router;
