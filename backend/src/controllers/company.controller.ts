import { Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { logActivity } from '../services/activity.service.js';

export const getCompanies = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, industry, isArchived, page = '1', limit = '50', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
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
      prisma.company.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc',
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
      prisma.company.count({ where }),
    ]);

    return sendSuccess(res, companies, undefined, 200, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('getCompanies error:', error);
    return sendError(res, 'Müşteri listesi alınamadı.', 500);
  }
};

export const getCompanyById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
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
      return sendError(res, 'Müşteri bulunamadı.', 404);
    }

    return sendSuccess(res, company);
  } catch (error) {
    console.error('getCompanyById error:', error);
    return sendError(res, 'Müşteri detayları alınamadı.', 500);
  }
};

export const createCompany = async (req: AuthRequest, res: Response) => {
  try {
    const {
      companyName,
      status = 'Active',
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
      primaryContact,
    } = req.body;

    const company = await prisma.company.create({
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
      await logActivity({
        userId: req.user.id,
        action: 'COMPANY_CREATED',
        description: `${req.user.name}, "${company.companyName}" adlı yeni müşteriyi sisteme ekledi.`,
        companyId: company.id,
      });
    }

    return sendSuccess(res, company, 'Müşteri başarıyla oluşturuldu.', 201);
  } catch (error) {
    console.error('createCompany error:', error);
    return sendError(res, 'Müşteri oluşturulamadı.', 500);
  }
};

export const updateCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    delete updateData.primaryContact; // handled via contacts API

    const existingCompany = await prisma.company.findUnique({ where: { id } });
    if (!existingCompany) {
      return sendError(res, 'Müşteri bulunamadı.', 404);
    }

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: updateData,
    });

    if (req.user) {
      let desc = `${req.user.name}, "${updatedCompany.companyName}" müşterisinin bilgilerini güncelledi.`;
      if (updateData.status && updateData.status !== existingCompany.status) {
        desc = `${req.user.name}, "${updatedCompany.companyName}" müşteri durumunu "${existingCompany.status}" -> "${updateData.status}" olarak değiştirdi.`;
      }

      await logActivity({
        userId: req.user.id,
        action: 'COMPANY_UPDATED',
        description: desc,
        companyId: updatedCompany.id,
      });
    }

    return sendSuccess(res, updatedCompany, 'Müşteri başarıyla güncellendi.');
  } catch (error) {
    console.error('updateCompany error:', error);
    return sendError(res, 'Müşteri güncellenemedi.', 500);
  }
};

export const archiveCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isArchived = true } = req.body;

    const company = await prisma.company.update({
      where: { id },
      data: { isArchived },
    });

    if (req.user) {
      await logActivity({
        userId: req.user.id,
        action: isArchived ? 'COMPANY_ARCHIVED' : 'COMPANY_RESTORED',
        description: isArchived
          ? `${req.user.name}, "${company.companyName}" müşterisini arşivledi.`
          : `${req.user.name}, "${company.companyName}" müşterisini arşivden çıkardı.`,
        companyId: company.id,
      });
    }

    return sendSuccess(res, company, isArchived ? 'Müşteri arşivlendi.' : 'Müşteri arşivden çıkarıldı.');
  } catch (error) {
    console.error('archiveCompany error:', error);
    return sendError(res, 'Müşteri arşivlenirken bir hata oluştu.', 500);
  }
};

// Contacts sub-resource
export const addContact = async (req: AuthRequest, res: Response) => {
  try {
    const { id: companyId } = req.params;
    const { name, position, phone, email, isPrimary } = req.body;

    if (isPrimary) {
      // reset other primaries
      await prisma.companyContact.updateMany({
        where: { companyId },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.companyContact.create({
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
      await logActivity({
        userId: req.user.id,
        action: 'CONTACT_ADDED',
        description: `${req.user.name}, müşteri için yeni yetkili kişi ekledi: "${name}" (${position || 'Yetkili'}).`,
        companyId,
      });
    }

    return sendSuccess(res, contact, 'Yetkili başarıyla eklendi.', 201);
  } catch (error) {
    console.error('addContact error:', error);
    return sendError(res, 'Yetkili eklenemedi.', 500);
  }
};

export const updateContact = async (req: AuthRequest, res: Response) => {
  try {
    const { contactId } = req.params;
    const { name, position, phone, email, isPrimary } = req.body;

    const contact = await prisma.companyContact.findUnique({ where: { id: contactId } });
    if (!contact) {
      return sendError(res, 'Yetkili bulunamadı.', 404);
    }

    if (isPrimary) {
      await prisma.companyContact.updateMany({
        where: { companyId: contact.companyId },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.companyContact.update({
      where: { id: contactId },
      data: {
        name,
        position,
        phone,
        email,
        isPrimary: isPrimary !== undefined ? isPrimary : contact.isPrimary,
      },
    });

    return sendSuccess(res, updated, 'Yetkili bilgileri güncellendi.');
  } catch (error) {
    console.error('updateContact error:', error);
    return sendError(res, 'Yetkili güncellenemedi.', 500);
  }
};

export const deleteContact = async (req: AuthRequest, res: Response) => {
  try {
    const { contactId } = req.params;
    await prisma.companyContact.delete({
      where: { id: contactId },
    });
    return sendSuccess(res, null, 'Yetkili silindi.');
  } catch (error) {
    console.error('deleteContact error:', error);
    return sendError(res, 'Yetkili silinemedi.', 500);
  }
};
