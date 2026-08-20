"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteContact = exports.updateContact = exports.addContact = exports.archiveCompany = exports.updateCompany = exports.createCompany = exports.getCompanyById = exports.getCompanies = void 0;
const prisma_js_1 = require("../utils/prisma.js");
const response_js_1 = require("../utils/response.js");
const activity_service_js_1 = require("../services/activity.service.js");
const getCompanies = async (req, res) => {
    try {
        const { search, status, industry, isArchived, page = '1', limit = '50', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 50;
        const skip = (pageNum - 1) * limitNum;
        const where = {
            isArchived: isArchived === 'true' ? true : false,
        };
        if (status && status !== 'ALL') {
            where.status = String(status);
        }
        if (industry && industry !== 'ALL') {
            where.industry = String(industry);
        }
        if (search) {
            const searchStr = String(search).toLowerCase();
            where.OR = [
                { companyName: { contains: searchStr } },
                { email: { contains: searchStr } },
                { phone: { contains: searchStr } },
                { taxNumber: { contains: searchStr } },
                { currentSoftware: { contains: searchStr } },
                { contacts: { some: { name: { contains: searchStr } } } },
            ];
        }
        const [companies, total] = await Promise.all([
            prisma_js_1.prisma.company.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: {
                    [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc',
                },
                include: {
                    contacts: {
                        where: { isPrimary: true },
                        take: 1,
                    },
                    _count: {
                        select: {
                            tasks: { where: { isArchived: false } },
                            customerRequests: { where: { isArchived: false } },
                            contacts: true,
                        },
                    },
                },
            }),
            prisma_js_1.prisma.company.count({ where }),
        ]);
        return (0, response_js_1.sendSuccess)(res, companies, undefined, 200, {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        });
    }
    catch (error) {
        console.error('getCompanies error:', error);
        return (0, response_js_1.sendError)(res, 'Müşteri listesi alınamadı.', 500);
    }
};
exports.getCompanies = getCompanies;
const getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await prisma_js_1.prisma.company.findUnique({
            where: { id },
            include: {
                contacts: {
                    orderBy: { isPrimary: 'desc' },
                },
                tasks: {
                    where: { isArchived: false },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        assignedUser: {
                            select: { id: true, name: true, email: true, role: true },
                        },
                        creator: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
                customerRequests: {
                    where: { isArchived: false },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        assignedUser: {
                            select: { id: true, name: true, email: true, role: true },
                        },
                        creator: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
                notes: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        creator: {
                            select: { id: true, name: true, email: true, role: true },
                        },
                    },
                },
                activities: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, role: true },
                        },
                    },
                },
            },
        });
        if (!company) {
            return (0, response_js_1.sendError)(res, 'Müşteri bulunamadı.', 404);
        }
        return (0, response_js_1.sendSuccess)(res, company);
    }
    catch (error) {
        console.error('getCompanyById error:', error);
        return (0, response_js_1.sendError)(res, 'Müşteri detayları alınamadı.', 500);
    }
};
exports.getCompanyById = getCompanyById;
const createCompany = async (req, res) => {
    try {
        const { companyName, status = 'Active', industry, description, website, phone, email, address, taxNumber, currentSoftware, eInvoiceStatus, eLedgerStatus, primaryContact, } = req.body;
        const company = await prisma_js_1.prisma.company.create({
            data: {
                companyName,
                status,
                industry,
                description,
                website,
                phone,
                email,
                address,
                taxNumber,
                currentSoftware,
                eInvoiceStatus,
                eLedgerStatus,
                contacts: primaryContact && primaryContact.name ? {
                    create: {
                        name: primaryContact.name,
                        position: primaryContact.position || 'Yetkili',
                        phone: primaryContact.phone || null,
                        email: primaryContact.email || null,
                        isPrimary: true,
                    }
                } : undefined,
            },
            include: {
                contacts: true,
            },
        });
        if (req.user) {
            await (0, activity_service_js_1.logActivity)({
                userId: req.user.id,
                action: 'COMPANY_CREATED',
                description: `${req.user.name}, "${company.companyName}" adlı yeni müşteriyi sisteme ekledi.`,
                companyId: company.id,
            });
        }
        return (0, response_js_1.sendSuccess)(res, company, 'Müşteri başarıyla oluşturuldu.', 201);
    }
    catch (error) {
        console.error('createCompany error:', error);
        return (0, response_js_1.sendError)(res, 'Müşteri oluşturulamadı.', 500);
    }
};
exports.createCompany = createCompany;
const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        delete updateData.primaryContact; // handled via contacts API
        const existingCompany = await prisma_js_1.prisma.company.findUnique({ where: { id } });
        if (!existingCompany) {
            return (0, response_js_1.sendError)(res, 'Müşteri bulunamadı.', 404);
        }
        const updatedCompany = await prisma_js_1.prisma.company.update({
            where: { id },
            data: updateData,
        });
        if (req.user) {
            let desc = `${req.user.name}, "${updatedCompany.companyName}" müşterisinin bilgilerini güncelledi.`;
            if (updateData.status && updateData.status !== existingCompany.status) {
                desc = `${req.user.name}, "${updatedCompany.companyName}" müşteri durumunu "${existingCompany.status}" -> "${updateData.status}" olarak değiştirdi.`;
            }
            await (0, activity_service_js_1.logActivity)({
                userId: req.user.id,
                action: 'COMPANY_UPDATED',
                description: desc,
                companyId: updatedCompany.id,
            });
        }
        return (0, response_js_1.sendSuccess)(res, updatedCompany, 'Müşteri başarıyla güncellendi.');
    }
    catch (error) {
        console.error('updateCompany error:', error);
        return (0, response_js_1.sendError)(res, 'Müşteri güncellenemedi.', 500);
    }
};
exports.updateCompany = updateCompany;
const archiveCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { isArchived = true } = req.body;
        const company = await prisma_js_1.prisma.company.update({
            where: { id },
            data: { isArchived },
        });
        if (req.user) {
            await (0, activity_service_js_1.logActivity)({
                userId: req.user.id,
                action: isArchived ? 'COMPANY_ARCHIVED' : 'COMPANY_RESTORED',
                description: isArchived
                    ? `${req.user.name}, "${company.companyName}" müşterisini arşivledi.`
                    : `${req.user.name}, "${company.companyName}" müşterisini arşivden çıkardı.`,
                companyId: company.id,
            });
        }
        return (0, response_js_1.sendSuccess)(res, company, isArchived ? 'Müşteri arşivlendi.' : 'Müşteri arşivden çıkarıldı.');
    }
    catch (error) {
        console.error('archiveCompany error:', error);
        return (0, response_js_1.sendError)(res, 'Müşteri arşivlenirken bir hata oluştu.', 500);
    }
};
exports.archiveCompany = archiveCompany;
// Contacts sub-resource
const addContact = async (req, res) => {
    try {
        const { id: companyId } = req.params;
        const { name, position, phone, email, isPrimary } = req.body;
        if (isPrimary) {
            // reset other primaries
            await prisma_js_1.prisma.companyContact.updateMany({
                where: { companyId },
                data: { isPrimary: false },
            });
        }
        const contact = await prisma_js_1.prisma.companyContact.create({
            data: {
                companyId,
                name,
                position,
                phone,
                email,
                isPrimary: !!isPrimary,
            },
        });
        if (req.user) {
            await (0, activity_service_js_1.logActivity)({
                userId: req.user.id,
                action: 'CONTACT_ADDED',
                description: `${req.user.name}, müşteri için yeni yetkili kişi ekledi: "${name}" (${position || 'Yetkili'}).`,
                companyId,
            });
        }
        return (0, response_js_1.sendSuccess)(res, contact, 'Yetkili başarıyla eklendi.', 201);
    }
    catch (error) {
        console.error('addContact error:', error);
        return (0, response_js_1.sendError)(res, 'Yetkili eklenemedi.', 500);
    }
};
exports.addContact = addContact;
const updateContact = async (req, res) => {
    try {
        const { contactId } = req.params;
        const { name, position, phone, email, isPrimary } = req.body;
        const contact = await prisma_js_1.prisma.companyContact.findUnique({ where: { id: contactId } });
        if (!contact) {
            return (0, response_js_1.sendError)(res, 'Yetkili bulunamadı.', 404);
        }
        if (isPrimary) {
            await prisma_js_1.prisma.companyContact.updateMany({
                where: { companyId: contact.companyId },
                data: { isPrimary: false },
            });
        }
        const updated = await prisma_js_1.prisma.companyContact.update({
            where: { id: contactId },
            data: {
                name,
                position,
                phone,
                email,
                isPrimary: isPrimary !== undefined ? isPrimary : contact.isPrimary,
            },
        });
        return (0, response_js_1.sendSuccess)(res, updated, 'Yetkili bilgileri güncellendi.');
    }
    catch (error) {
        console.error('updateContact error:', error);
        return (0, response_js_1.sendError)(res, 'Yetkili güncellenemedi.', 500);
    }
};
exports.updateContact = updateContact;
const deleteContact = async (req, res) => {
    try {
        const { contactId } = req.params;
        await prisma_js_1.prisma.companyContact.delete({
            where: { id: contactId },
        });
        return (0, response_js_1.sendSuccess)(res, null, 'Yetkili silindi.');
    }
    catch (error) {
        console.error('deleteContact error:', error);
        return (0, response_js_1.sendError)(res, 'Yetkili silinemedi.', 500);
    }
};
exports.deleteContact = deleteContact;
