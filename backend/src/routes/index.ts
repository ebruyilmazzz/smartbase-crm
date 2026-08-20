import { Router } from 'express';
import authRoutes from './auth.routes.js';
import companyRoutes from './company.routes.js';
import taskRoutes from './task.routes.js';
import requestRoutes from './request.routes.js';
import activityRoutes from './activity.routes.js';
import noteRoutes from './note.routes.js';
import reportRoutes from './report.routes.js';
import searchRoutes from './search.routes.js';
import settingsRoutes from './settings.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/tasks', taskRoutes);
router.use('/requests', requestRoutes);
router.use('/activities', activityRoutes);
router.use('/notes', noteRoutes);
router.use('/reports', reportRoutes);
router.use('/search', searchRoutes);
router.use('/settings', settingsRoutes);

export default router;
