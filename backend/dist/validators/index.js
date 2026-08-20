"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNoteSchema = exports.createNoteSchema = exports.updateRequestSchema = exports.createRequestSchema = exports.updateTaskSchema = exports.createTaskSchema = exports.updateCompanySchema = exports.createCompanySchema = exports.companyContactSchema = exports.updateUserSchema = exports.createUserSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Geçerli bir e-posta adresi giriniz.'),
    password: zod_1.z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
});
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'İsim en az 2 karakter olmalıdır.'),
    email: zod_1.z.string().email('Geçerli bir e-posta adresi giriniz.'),
    password: zod_1.z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
    role: zod_1.z.enum(['ADMIN', 'SALES', 'DEVELOPER']),
    status: zod_1.z.enum(['ACTIVE', 'DISABLED']).optional(),
});
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(6).optional(),
    role: zod_1.z.enum(['ADMIN', 'SALES', 'DEVELOPER']).optional(),
    status: zod_1.z.enum(['ACTIVE', 'DISABLED']).optional(),
});
exports.companyContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'İsim zorunludur.'),
    position: zod_1.z.string().optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().email().optional().nullable().or(zod_1.z.literal('')),
    isPrimary: zod_1.z.boolean().optional(),
});
exports.createCompanySchema = zod_1.z.object({
    companyName: zod_1.z.string().min(2, 'Şirket adı zorunludur.'),
    status: zod_1.z.string().default('Active'),
    industry: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string().optional().nullable(),
    website: zod_1.z.string().optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().email().optional().nullable().or(zod_1.z.literal('')),
    address: zod_1.z.string().optional().nullable(),
    taxNumber: zod_1.z.string().optional().nullable(),
    currentSoftware: zod_1.z.string().optional().nullable(),
    eInvoiceStatus: zod_1.z.string().optional().nullable(),
    eLedgerStatus: zod_1.z.string().optional().nullable(),
    primaryContact: exports.companyContactSchema.optional().nullable(),
});
exports.updateCompanySchema = exports.createCompanySchema.partial();
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'İş başlığı zorunludur.'),
    description: zod_1.z.string().optional().nullable(),
    companyId: zod_1.z.string().min(1, 'Şirket seçimi zorunludur.'),
    status: zod_1.z.string().default('Pending'),
    priority: zod_1.z.string().default('Medium'),
    assignedUserId: zod_1.z.string().optional().nullable(),
    startDate: zod_1.z.string().optional().nullable(),
    dueDate: zod_1.z.string().optional().nullable(),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).optional(),
    description: zod_1.z.string().optional().nullable(),
    companyId: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    priority: zod_1.z.string().optional(),
    assignedUserId: zod_1.z.string().optional().nullable(),
    startDate: zod_1.z.string().optional().nullable(),
    dueDate: zod_1.z.string().optional().nullable(),
});
exports.createRequestSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Talep başlığı zorunludur.'),
    companyId: zod_1.z.string().min(1, 'Şirket seçimi zorunludur.'),
    description: zod_1.z.string().min(5, 'Talep açıklaması en az 5 karakter olmalıdır.'),
    requestedBy: zod_1.z.string().optional().nullable(),
    priority: zod_1.z.string().default('Medium'),
    status: zod_1.z.string().default('New'),
    assignedUserId: zod_1.z.string().optional().nullable(),
    solution: zod_1.z.string().optional().nullable(),
});
exports.updateRequestSchema = exports.createRequestSchema.partial();
exports.createNoteSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Not içeriği boş bırakılamaz.'),
    companyId: zod_1.z.string().optional().nullable(),
    taskId: zod_1.z.string().optional().nullable(),
    requestId: zod_1.z.string().optional().nullable(),
});
exports.updateNoteSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Not içeriği boş bırakılamaz.'),
});
