import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { accept, generate, reject, regenerate } from '../controllers/imageController.js';
import { acceptImageValidator, generateImageValidator, rejectImageValidator, regenerateImageValidator } from '../validators/imageValidators.js';

const router = Router();

router.use(protect);

router.post('/generate', generateImageValidator, generate);
router.post('/regenerate', regenerateImageValidator, regenerate);
router.post('/accept', acceptImageValidator, accept);
router.post('/reject', rejectImageValidator, reject);

export default router;
