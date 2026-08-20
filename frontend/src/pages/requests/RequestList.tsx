import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Flame,
  Plus,
  Search,
  Filter,
  Building2,
  Calendar,
  User,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { requestService } from '../../services/request.service.js';
import { companyService } from '../../services/company.service.js';
import { settingsService } from '../../services/settings.service.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { Textarea } from '../../components/common/Textarea.js';
import { Select } from '../../components/common/Select.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { PriorityBadge } from '../../components/common/PriorityBadge.js';
import { Modal } from '../../components/common/Modal.js';
import { Pagination } from '../../components/common/Pagination.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { formatDate } from '../../utils/formatters.js';

const requestFormSchema = z.object({
  title: z.string().min(2, 'Talep başlığı en az 2 karakter olmalıdır.'),
  companyId: z.string().min(1, 'Müşteri seçimi zorunludur.'),
  description: z.string().min(5, 'Talep açıklaması en az 5 karakter olmalıdır.'),
  requestedBy: z.string().optional(),
  priority: z.string().default('Medium'),
  status: z.string().default('New'),
  assignedUserId: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestFormSchema>;

export const RequestList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'ALL');
  const [companyFilter, setCompanyFilter] = useState(searchParams.get('companyId') || 'ALL');
  const [page, setPage] = useState(1);
  const [isNewModalOpen, setIsNewModalOpen] = useState(searchParams.get('action') === 'new');

  const { isAdmin, isSales } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      status: 'New',
      priority: 'Medium',
    },
  });

  // Fetch companies for select
  const { data: companiesData } = useQuery({
    queryKey: ['companiesDropdown'],
    queryFn: async () => {
      const res = await companyService.getCompanies({ limit: 100 });
      return res.data;
    },
  });

  // Fetch users for assign
  const { data: usersData } = useQuery({
    queryKey: ['usersDropdown'],
    queryFn: async () => {
      const res = await settingsService.getUsers();
      return res.data;
    },
    enabled: isAdmin || isSales,
  });

  // Fetch requests
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['requests', { page, search: searchTerm, status: statusFilter, priority: priorityFilter, companyId: companyFilter }],
    queryFn: async () => {
      const res = await requestService.getRequests({
        page,
        limit: 15,
        search: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        companyId: companyFilter !== 'ALL' ? companyFilter : undefined,
      });
      return res;
    },
  });

  // Create Request Mutation
  const createRequestMutation = useMutation({
    mutationFn: async (formData: RequestFormData) => {
      return await requestService.createRequest(formData);
    },
    onSuccess: (res) => {
      success(`"${res.data.title}" talebi başarıyla kaydedildi.`);
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsNewModalOpen(false);
      reset();
      navigate(`/requests/${res.data.id}`);
    },
    onError: (err: any) => {
      toastError(err.message || 'Talep oluşturulurken bir hata oluştu.');
    },
  });

  const onSubmit = (formData: RequestFormData) => {
    createRequestMutation.mutate(formData);
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Müşteri Talepleri</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Müşterilerden gelen istekler, hata bildirimleri ve geliştirme talepleri
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
            Yeni Talep Aç
          </Button>
        )}
      </div>

      {/* Filters Card */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Talep başlığı, şirket adı, talep eden veya çözüm ara..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 text-xs bg-slate-50"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="New">Yeni</option>
              <option value="Analysis">Analiz</option>
              <option value="Development">Geliştirmede</option>
              <option value="Waiting for Customer">Müşteri Bekleniyor</option>
              <option value="Completed">Tamamlandı</option>
              <option value="Cancelled">İptal</option>
            </Select>

            <Select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 text-xs bg-slate-50"
            >
              <option value="ALL">Tüm Öncelikler</option>
              <option value="Urgent">Acil</option>
              <option value="High">Yüksek</option>
              <option value="Medium">Orta</option>
              <option value="Low">Düşük</option>
            </Select>

            <Button type="submit" variant="secondary" size="sm" leftIcon={<Filter className="w-3.5 h-3.5" />}>
              Filtrele
            </Button>
          </div>
        </form>
      </Card>

      {/* Requests Table Card */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <LoadingState message="Talep listesi getiriliyor..." />
        ) : isError || !data ? (
          <div className="p-8 text-center text-xs text-rose-500">
            Talep kayıtları yüklenirken bir sorun oluştu.
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState
            title="Talep kaydı bulunamadı"
            description="Arama kriterlerinize uyan kayıt bulunamadı veya henüz müşteri talebi girilmemiş."
            actionText={(isAdmin || isSales) ? "+ İlk Talebi Gir" : undefined}
            onAction={() => setIsNewModalOpen(true)}
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-5">Talep Başlığı</th>
                    <th className="py-3 px-4">Müşteri</th>
                    <th className="py-3 px-4">Talep Eden</th>
                    <th className="py-3 px-4">Öncelik</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4">Sorumlu</th>
                    <th className="py-3 px-4">Kayıt Tarihi</th>
                    <th className="py-3 px-5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => navigate(`/requests/${req.id}`)}
                      className="hover:bg-slate-50/90 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                          {req.title}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-sm mt-0.5">
                          {req.description}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {req.company?.companyName || '-'}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {req.requestedBy || <span className="text-slate-400 italic">Belirtilmedi</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={req.priority} />
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={req.status} />
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {req.assignedUser?.name || <span className="text-slate-400 italic">Atanmamış</span>}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(req.createdAt)}
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/requests/${req.id}`)}
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
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

      {/* New Request Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Yeni Müşteri Talebi Kaydı"
        description="Müşteriden iletilen yeni bir istek veya hata bildirimini sisteme işleyin."
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Talep Başlığı"
            placeholder="Örn: Sipariş Çıktısına Karekod Eklenmesi Talebi"
            required
            error={errors.title?.message}
            {...register('title')}
          />

          <Select
            label="İlişkili Müşteri"
            required
            error={errors.companyId?.message}
            {...register('companyId')}
          >
            <option value="">-- Müşteri Şirketini Seçiniz --</option>
            {companiesData?.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.companyName}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Talep Eden Kişi"
              placeholder="Örn: Hasan Bey (Müdür)"
              {...register('requestedBy')}
            />

            <Select label="Öncelik" {...register('priority')}>
              <option value="Urgent">Acil</option>
              <option value="High">Yüksek</option>
              <option value="Medium">Orta</option>
              <option value="Low">Düşük</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Durum" {...register('status')}>
              <option value="New">Yeni</option>
              <option value="Analysis">Analiz</option>
              <option value="Development">Geliştirmede</option>
              <option value="Waiting for Customer">Müşteri Bekleniyor</option>
              <option value="Completed">Tamamlandı</option>
            </Select>

            <Select label="Atanan Sorumlu" {...register('assignedUserId')}>
              <option value="">-- Sorumlu Ataması Yok --</option>
              {usersData?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Talep Açıklaması & İhtiyaç Detayı"
            placeholder="Müşterinin ilettiği tam gereksinim ve açıklamalar..."
            rows={3}
            required
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewModalOpen(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Talebi Kaydet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
