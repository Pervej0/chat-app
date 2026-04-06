import { Router } from 'express';
import healthRouter from '../modules/health/health.router';
import authRouter from '../modules/auth/auth.router';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);

export default router;