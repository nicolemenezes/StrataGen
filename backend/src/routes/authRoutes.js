import { Router } from 'express';
import { login, me, register } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { loginValidator, registerValidator } from '../validators/authValidators.js';

const router = Router();

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/me', protect, me);

export default router;
