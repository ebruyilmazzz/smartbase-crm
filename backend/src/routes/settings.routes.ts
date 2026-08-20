import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  getStatuses,
  createStatus,
  updateStatus,
  getPriorities,
  createPriority,
  updatePriority,
} from '../controllers/settings.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createUserSchema, updateUserSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Statuses & Priorities can be fetched by all authenticated users to populate dropdowns
router.get('/statuses', getStatuses);
router.get('/priorities', getPriorities);

// Admin-only management routes
router.use(requireAdmin);

router.get('/users', getUsers);
router.post('/users', validate(createUserSchema), createUser);
router.put('/users/:id', validate(updateUserSchema), updateUser);

router.post('/statuses', createStatus);
router.put('/statuses/:id', updateStatus);

router.post('/priorities', createPriority);
router.put('/priorities/:id', updatePriority);

export default router;
