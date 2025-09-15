import { Router } from 'express';
import healthRouter from '@/modules/health/health.routes';
import sessionRouter from '@/modules/session/session.routes';

const router = Router();

router.use('/health', healthRouter);
router.use('/sessions', sessionRouter);

export default router;
