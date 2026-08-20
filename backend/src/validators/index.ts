import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır.'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
  role: z.enum(['ADMIN', 'SALES', 'DEVELOPER']),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'SALES', 'DEVELOPER']).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
});

export const companyContactSchema = z.object({
  name: z.string().min(2, 'İsim zorunludur.'),
  position: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  isPrimary: z.boolean().optional(),
});

export const createCompanySchema = z.object({
  companyName: z.string().min(2, 'Şirket adı zorunludur.'),
  status: z.string().default('Active'),
  industry: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  currentSoftware: z.string().optional().nullable(),
  eInvoiceStatus: z.string().optional().nullable(),
  eLedgerStatus: z.string().optional().nullable(),
  primaryContact: companyContactSchema.optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const createTaskSchema = z.object({
  title: z.string().min(2, 'İş başlığı zorunludur.'),
  description: z.string().optional().nullable(),
  companyId: z.string().min(1, 'Şirket seçimi zorunludur.'),
  status: z.string().default('Pending'),
  priority: z.string().default('Medium'),
  assignedUserId: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  companyId: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedUserId: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const createRequestSchema = z.object({
  title: z.string().min(2, 'Talep başlığı zorunludur.'),
  companyId: z.string().min(1, 'Şirket seçimi zorunludur.'),
  description: z.string().min(5, 'Talep açıklaması en az 5 karakter olmalıdır.'),
  requestedBy: z.string().optional().nullable(),
  priority: z.string().default('Medium'),
  status: z.string().default('New'),
  assignedUserId: z.string().optional().nullable(),
  solution: z.string().optional().nullable(),
});

export const updateRequestSchema = createRequestSchema.partial();

export const createNoteSchema = z.object({
  content: z.string().min(1, 'Not içeriği boş bırakılamaz.'),
  companyId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  requestId: z.string().optional().nullable(),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1, 'Not içeriği boş bırakılamaz.'),
});
