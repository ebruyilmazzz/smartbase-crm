import { Router } from 'express';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  archiveCompany,
  addContact,
  updateContact,
  deleteContact,
} from '../controllers/company.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin, requireSalesOrAdmin } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createCompanySchema, updateCompanySchema, companyContactSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/', getCompanies);
router.get('/:id', getCompanyById);
router.post('/', requireSalesOrAdmin, validate(createCompanySchema), createCompany);
router.put('/:id', requireSalesOrAdmin, validate(updateCompanySchema), updateCompany);
router.delete('/:id', requireAdmin, archiveCompany);

// Contact sub-routes
router.post('/:id/contacts', requireSalesOrAdmin, validate(companyContactSchema), addContact);
router.put('/contacts/:contactId', requireSalesOrAdmin, validate(companyContactSchema.partial()), updateContact);
router.delete('/contacts/:contactId', requireSalesOrAdmin, deleteContact);

export default router;
