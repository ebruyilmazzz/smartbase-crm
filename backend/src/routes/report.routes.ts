import { Router } from 'express';
import { getDashboardStats, getReportsData } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getReportsData);

export default router;
