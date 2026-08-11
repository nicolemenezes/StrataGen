import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generate } from '../controllers/imageController.js';
import { generateImageValidator } from '../validators/imageValidators.js';

const router = Router();

router.use(protect);

router.post('/generate', generateImageValidator, generate);

export default router;
