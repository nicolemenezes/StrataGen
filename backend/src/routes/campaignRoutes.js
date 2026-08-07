import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { create, list, read, remove, saveGenerated, update } from '../controllers/campaignController.js';
import {
  campaignIdValidator,
  createCampaignValidator,
  listCampaignsValidator,
  saveGeneratedCampaignValidator,
  updateCampaignValidator,
} from '../validators/campaignValidators.js';

const router = Router();

router.use(protect);

router.post('/', createCampaignValidator, create);
router.post('/save', saveGeneratedCampaignValidator, saveGenerated);
router.get('/', listCampaignsValidator, list);
router.get('/:id', campaignIdValidator, read);
router.put('/:id', campaignIdValidator, updateCampaignValidator, update);
router.delete('/:id', campaignIdValidator, remove);

export default router;
