import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  disconnectInstagram,
  getInstagramConnection,
  instagramCallback,
  readInstagramConnection,
} from '../controllers/socialController.js';

const router = Router();

router.get('/instagram/callback', instagramCallback);
router.get('/instagram/connect', protect, getInstagramConnection);
router.get('/instagram', protect, readInstagramConnection);
router.delete('/instagram', protect, disconnectInstagram);

export default router;
