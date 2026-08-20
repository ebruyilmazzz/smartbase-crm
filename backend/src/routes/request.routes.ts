import { Router } from 'express';
import {
  getRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
} from '../controllers/request.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireSalesOrAdmin } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createRequestSchema, updateRequestSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/', getRequests);
router.get('/:id', getRequestById);
router.post('/', requireSalesOrAdmin, validate(createRequestSchema), createRequest);
router.put('/:id', validate(updateRequestSchema), updateRequest);
router.delete('/:id', requireSalesOrAdmin, deleteRequest);

export default router;
