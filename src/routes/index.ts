import { Router } from 'express';
import healthRouter from './health/health.router';
import authRouter from './auth/auth.router';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);

export default router;