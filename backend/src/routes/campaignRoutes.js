import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { create, list, read, remove, update } from '../controllers/campaignController.js';
import { campaignIdValidator, createCampaignValidator, listCampaignsValidator, updateCampaignValidator } from '../validators/campaignValidators.js';

const router = Router();

router.use(protect);

router.post('/', createCampaignValidator, create);
router.get('/', listCampaignsValidator, list);
router.get('/:id', campaignIdValidator, read);
router.put('/:id', campaignIdValidator, updateCampaignValidator, update);
router.delete('/:id', campaignIdValidator, remove);

export default router;
