import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Building2,
  Calendar,
  User,
  Eye,
  Archive,
  Flame,
} from 'lucide-react';
import { taskService } from '../../services/task.service.js';
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

const taskFormSchema = z.object({
  title: z.string().min(2, 'İş başlığı en az 2 karakter olmalıdır.'),
  companyId: z.string().min(1, 'Müşteri seçimi zorunludur.'),
  description: z.string().optional(),
  status: z.string().default('Pending'),
  priority: z.string().default('Medium'),
  assignedUserId: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

export const TaskList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'ALL');
  const [companyFilter, setCompanyFilter] = useState(searchParams.get('companyId') || 'ALL');
  const [page, setPage] = useState(1);
  const [isNewModalOpen, setIsNewModalOpen] = useState(searchParams.get('action') === 'new');

  const { isAdmin, isSales, user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      status: 'Pending',
      priority: 'Medium',
    },
  });

  // Fetch companies for dropdown
  const { data: companiesData } = useQuery({
    queryKey: ['companiesDropdown'],
    queryFn: async () => {
      const res = await companyService.getCompanies({ limit: 100 });
      return res.data;
    },
  });

  // Fetch users for assignment dropdown
  const { data: usersData } = useQuery({
    queryKey: ['usersDropdown'],
    queryFn: async () => {
      const res = await settingsService.getUsers();
      return res.data;
    },
    enabled: isAdmin || isSales,
  });

  // Fetch tasks
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['tasks', { page, search: searchTerm, status: statusFilter, priority: priorityFilter, companyId: companyFilter }],
    queryFn: async () => {
      const res = await taskService.getTasks({
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

  // Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: async (formData: TaskFormData) => {
      return await taskService.createTask(formData);
    },
    onSuccess: (res) => {
      success(`"${res.data.title}" işi başarıyla oluşturuldu.`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsNewModalOpen(false);
      reset();
      navigate(`/tasks/${res.data.id}`);
    },
    onError: (err: any) => {
      toastError(err.message || 'İş oluşturulurken bir hata oluştu.');
    },
  });

  const onSubmit = (formData: TaskFormData) => {
    createTaskMutation.mutate(formData);
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">İşler & Yazılım Geliştirme</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Müşterilere ait aktif geliştirme görevleri, durumları ve sorumluları
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
            Yeni İş Aç
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="İş başlığı, şirket adı veya açıklama ara..."
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
              <option value="Pending">Beklemede</option>
              <option value="Analysis">Analiz</option>
              <option value="Planned">Planlandı</option>
              <option value="Development">Geliştirmede</option>
              <option value="Testing">Testte</option>
              <option value="Customer Approval">Müşteri Onayı</option>
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

      {/* Task List Table Card */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <LoadingState message="İş listesi getiriliyor..." />
        ) : isError || !data ? (
          <div className="p-8 text-center text-xs text-rose-500">
            İş kayıtları yüklenirken bir sorun oluştu.
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState
            title="İş kaydı bulunamadı"
            description="Kriterlerinize uyan kayıt bulunamadı veya henüz görev açılmamış."
            actionText={(isAdmin || isSales) ? "+ İlk İşi Oluştur" : undefined}
            onAction={() => setIsNewModalOpen(true)}
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-5">İş Başlığı</th>
                    <th className="py-3 px-4">Müşteri</th>
                    <th className="py-3 px-4">Öncelik</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4">Sorumlu</th>
                    <th className="py-3 px-4">Başlangıç</th>
                    <th className="py-3 px-4">Hedef Tarih</th>
                    <th className="py-3 px-5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="hover:bg-slate-50/90 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-[11px] text-slate-500 truncate max-w-sm mt-0.5">
                            {task.description}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {task.company?.companyName || '-'}
                      </td>

                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={task.priority} />
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={task.status} />
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {task.assignedUser?.name || <span className="text-slate-400 italic">Atanmamış</span>}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(task.startDate)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-medium">
                        {formatDate(task.dueDate)}
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/tasks/${task.id}`)}
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

      {/* New Task Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Yeni İş / Görev Oluştur"
        description="Müşteri için yazılım geliştirme veya teknik görev kaydı açın."
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="İş Başlığı"
            placeholder="Örn: E-Fatura Entegrasyonu ve Test Süreci"
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
            <Select label="Durum" {...register('status')}>
              <option value="Pending">Beklemede</option>
              <option value="Analysis">Analiz</option>
              <option value="Planned">Planlandı</option>
              <option value="Development">Geliştirmede</option>
              <option value="Testing">Testte</option>
              <option value="Customer Approval">Müşteri Onayı</option>
              <option value="Completed">Tamamlandı</option>
            </Select>

            <Select label="Öncelik" {...register('priority')}>
              <option value="Urgent">Acil</option>
              <option value="High">Yüksek</option>
              <option value="Medium">Orta</option>
              <option value="Low">Düşük</option>
            </Select>
          </div>

          <Select label="Atanan Geliştirici / Sorumlu" {...register('assignedUserId')}>
            <option value="">-- Sorumlu Ataması Yapılmadı --</option>
            {usersData?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Başlangıç Tarihi" type="date" {...register('startDate')} />
            <Input label="Hedef Bitiş Tarihi" type="date" {...register('dueDate')} />
          </div>

          <Textarea
            label="İş Açıklaması & Teknik Notlar"
            placeholder="Geliştirme hedefleri, veritabanı gereksinimleri..."
            rows={3}
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
              İşi Oluştur
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
