import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Archive,
  Eye,
  CheckCircle2,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { companyService } from '../../services/company.service.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { Textarea } from '../../components/common/Textarea.js';
import { Select } from '../../components/common/Select.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { Modal } from '../../components/common/Modal.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';
import { Pagination } from '../../components/common/Pagination.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { formatDate } from '../../utils/formatters.js';

const companyFormSchema = z.object({
  companyName: z.string().min(2, 'Şirket adı en az 2 karakter olmalıdır.'),
  status: z.string().default('Active'),
  industry: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
  website: z.string().optional(),
  taxNumber: z.string().optional(),
  currentSoftware: z.string().optional(),
  eInvoiceStatus: z.string().default('Hayır'),
  eLedgerStatus: z.string().default('Hayır'),
  address: z.string().optional(),
  description: z.string().optional(),
  contactName: z.string().optional(),
  contactPosition: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email('Geçerli e-posta').optional().or(z.literal('')),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

export const CompanyList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [industryFilter, setIndustryFilter] = useState(searchParams.get('industry') || 'ALL');
  const [page, setPage] = useState(1);
  const [isNewModalOpen, setIsNewModalOpen] = useState(searchParams.get('action') === 'new');
  const [companyToArchive, setCompanyToArchive] = useState<{ id: string; name: string } | null>(null);

  const { isAdmin, isSales } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      status: 'Active',
      eInvoiceStatus: 'Hayır',
      eLedgerStatus: 'Hayır',
    },
  });

  // Query companies
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['companies', { page, search: searchTerm, status: statusFilter, industry: industryFilter }],
    queryFn: async () => {
      const res = await companyService.getCompanies({
        page,
        limit: 15,
        search: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        industry: industryFilter !== 'ALL' ? industryFilter : undefined,
      });
      return res;
    },
  });

  // Create Company Mutation
  const createMutation = useMutation({
    mutationFn: async (formData: CompanyFormData) => {
      const payload: any = {
        companyName: formData.companyName,
        status: formData.status,
        industry: formData.industry || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        taxNumber: formData.taxNumber || null,
        currentSoftware: formData.currentSoftware || null,
        eInvoiceStatus: formData.eInvoiceStatus || 'Hayır',
        eLedgerStatus: formData.eLedgerStatus || 'Hayır',
        address: formData.address || null,
        description: formData.description || null,
      };

      if (formData.contactName) {
        payload.primaryContact = {
          name: formData.contactName,
          position: formData.contactPosition || 'Yetkili',
          phone: formData.contactPhone || null,
          email: formData.contactEmail || null,
        };
      }

      return await companyService.createCompany(payload);
    },
    onSuccess: (res) => {
      success(`"${res.data.companyName}" müşterisi başarıyla oluşturuldu.`);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsNewModalOpen(false);
      reset();
      navigate(`/companies/${res.data.id}`);
    },
    onError: (err: any) => {
      toastError(err.message || 'Müşteri eklenirken hata oluştu.');
    },
  });

  // Archive Company Mutation
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await companyService.archiveCompany(id, true);
    },
    onSuccess: () => {
      success('Müşteri arşivlendi.');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setCompanyToArchive(null);
    },
    onError: (err: any) => {
      toastError(err.message || 'Arşivleme işlemi başarısız.');
    },
  });

  const onSubmit = (formData: CompanyFormData) => {
    createMutation.mutate(formData);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Müşteriler</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistemde kayıtlı müşteri şirketleri, yetkili kişileri ve durumları
          </p>
        </div>
        {(isAdmin || isSales) && (
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              reset();
              setIsNewModalOpen(true);
            }}
          >
            Yeni Müşteri Ekle
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Müşteri adı, vergi no, telefon, yazılım veya yetkili ara..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 text-xs bg-slate-50"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="Active">Aktif</option>
              <option value="Lead">Aday (Lead)</option>
              <option value="Analysis">Analiz Aşamasında</option>
              <option value="Passive">Pasif</option>
              <option value="Completed">Tamamlandı</option>
            </Select>

            <Button type="submit" variant="secondary" size="sm" leftIcon={<Filter className="w-3.5 h-3.5" />}>
              Filtrele
            </Button>
          </div>
        </form>
      </Card>

      {/* Companies Table Card */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <LoadingState message="Müşteri listesi getiriliyor..." />
        ) : isError || !data ? (
          <div className="p-8 text-center text-xs text-rose-500">
            Müşteri kayıtları yüklenirken bir hata oluştu.
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState
            title="Müşteri bulunamadı"
            description="Kriterlerinize uyan kayıt bulunamadı veya henüz müşteri eklenmemiş."
            actionText={(isAdmin || isSales) ? "+ İlk Müşteriyi Ekle" : undefined}
            onAction={() => setIsNewModalOpen(true)}
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-5">Müşteri Şirketi</th>
                    <th className="py-3 px-4">Birincil Yetkili</th>
                    <th className="py-3 px-4">Sektör</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4">Mevcut Yazılım</th>
                    <th className="py-3 px-4 text-center">İş / Talep</th>
                    <th className="py-3 px-4">Kayıt Tarihi</th>
                    <th className="py-3 px-5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.map((company) => {
                    const primaryContact = company.contacts && company.contacts.length > 0 ? company.contacts[0] : null;

                    return (
                      <tr
                        key={company.id}
                        onClick={() => navigate(`/companies/${company.id}`)}
                        className="hover:bg-slate-50/90 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                            {company.companyName}
                          </div>
                          {company.email && (
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {company.email}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {primaryContact ? (
                            <div>
                              <div className="font-semibold text-slate-800 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" /> {primaryContact.name}
                              </div>
                              <div className="text-[11px] text-slate-500">{primaryContact.position || 'Yetkili'}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Belirtilmedi</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {company.industry || '-'}
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge status={company.status} />
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {company.currentSoftware || '-'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1 font-semibold text-[11px]">
                            <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                              {company._count?.tasks || 0} İş
                            </span>
                            <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                              {company._count?.customerRequests || 0} Talep
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {formatDate(company.createdAt)}
                        </td>

                        <td className="py-3.5 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/companies/${company.id}`)}
                              title="Detayları Görüntüle"
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCompanyToArchive({ id: company.id, name: company.companyName })}
                                title="Müşteriyi Arşivle"
                              >
                                <Archive className="w-4 h-4 text-rose-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {data.meta && (
              <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                <Pagination
                  currentPage={data.meta.page}
                  totalPages={data.meta.totalPages}
                  totalItems={data.meta.total}
                  onPageChange={(newPage) => setPage(newPage)}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* New Company Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Yeni Müşteri Kaydı"
        description="SmartBase CRM veritabanına yeni bir müşteri şirketi ve yetkilisini ekleyin."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Şirket Adı"
              placeholder="Örn: Nova Wood A.Ş."
              required
              error={errors.companyName?.message}
              {...register('companyName')}
            />

            <Select label="Müşteri Durumu" {...register('status')}>
              <option value="Active">Aktif</option>
              <option value="Lead">Aday (Lead)</option>
              <option value="Analysis">Analiz Aşamasında</option>
              <option value="Passive">Pasif</option>
              <option value="Completed">Tamamlandı</option>
            </Select>

            <Input
              label="Sektör"
              placeholder="Örn: Mobilya & Ağaç Sanayi"
              {...register('industry')}
            />

            <Input
              label="Şirket Telefonu"
              placeholder="Örn: +90 212 555 0000"
              {...register('phone')}
            />

            <Input
              label="Şirket E-posta"
              placeholder="info@sirket.com"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Web Sitesi"
              placeholder="https://www.sirket.com"
              {...register('website')}
            />

            <Input
              label="Vergi Numarası"
              placeholder="10 Haneli Vergi No"
              {...register('taxNumber')}
            />

            <Input
              label="Mevcut Kullandığı Yazılım / Muhasebe"
              placeholder="Örn: Logo Tiger, Mikro, Özel Makro"
              {...register('currentSoftware')}
            />

            <Select label="E-Fatura Durumu" {...register('eInvoiceStatus')}>
              <option value="Evet">Evet</option>
              <option value="Hayır">Hayır</option>
              <option value="Süreçte">Süreçte</option>
            </Select>

            <Select label="E-Defter Durumu" {...register('eLedgerStatus')}>
              <option value="Evet">Evet</option>
              <option value="Hayır">Hayır</option>
              <option value="Süreçte">Süreçte</option>
            </Select>
          </div>

          <Input
            label="Adres"
            placeholder="Şirket açık adresi..."
            {...register('address')}
          />

          <Textarea
            label="İş / Şirket Açıklaması & İhtiyaçları"
            placeholder="Müşterinin faaliyet alanı, mevcut sistem sorunları ve hedefleri..."
            rows={2}
            {...register('description')}
          />

          {/* Primary Contact Section */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Birincil Yetkili Kişi Bilgileri
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Yetkili Adı Soyadı"
                placeholder="Örn: Hasan Bey"
                {...register('contactName')}
              />
              <Input
                label="Görevi / Pozisyonu"
                placeholder="Örn: Genel Müdür"
                {...register('contactPosition')}
              />
              <Input
                label="Yetkili Telefonu"
                placeholder="+90 532 000 0000"
                {...register('contactPhone')}
              />
              <Input
                label="Yetkili E-postası"
                placeholder="hasan@sirket.com"
                type="email"
                error={errors.contactEmail?.message}
                {...register('contactEmail')}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewModalOpen(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Müşteriyi Kaydet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Archive Confirmation Dialog */}
      {companyToArchive && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setCompanyToArchive(null)}
          onConfirm={() => archiveMutation.mutate(companyToArchive.id)}
          isLoading={archiveMutation.isPending}
          title="Müşteriyi Arşivle"
          message={`"${companyToArchive.name}" adlı müşteriyi arşivlemek istediğinize emin misiniz? Arşivlenen müşteriler varsayılan listede görünmez ancak verileri korunur.`}
          confirmText="Arşivle"
        />
      )}
    </div>
  );
};
