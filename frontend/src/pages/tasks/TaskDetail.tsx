import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckSquare,
  Building2,
  Calendar,
  User,
  Edit,
  Clock,
  MessageSquare,
  Activity as ActivityIcon,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { taskService } from '../../services/task.service.js';
import { noteService } from '../../services/note.service.js';
import { settingsService } from '../../services/settings.service.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Card, CardHeader } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { Textarea } from '../../components/common/Textarea.js';
import { Select } from '../../components/common/Select.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { PriorityBadge } from '../../components/common/PriorityBadge.js';
import { Modal } from '../../components/common/Modal.js';
import { ActivityTimeline } from '../../components/activity/ActivityTimeline.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { formatDate, formatDateTime } from '../../utils/formatters.js';

const editTaskSchema = z.object({
  title: z.string().min(2, 'İş başlığı zorunludur.'),
  description: z.string().optional(),
  status: z.string(),
  priority: z.string(),
  assignedUserId: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const { user, isAdmin, isSales, isDeveloper } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch Task
  const { data: task, isLoading, isError } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      if (!id) throw new Error('Geçersiz ID');
      const res = await taskService.getTask(id);
      return res.data;
    },
    enabled: !!id,
  });

  // Fetch Users for assignment
  const { data: users } = useQuery({
    queryKey: ['usersDropdown'],
    queryFn: async () => {
      const res = await settingsService.getUsers();
      return res.data;
    },
  });

  // Edit Task Form
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<z.infer<typeof editTaskSchema>>({
    resolver: zodResolver(editTaskSchema),
    values: task
      ? {
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          assignedUserId: task.assignedUserId || '',
          startDate: task.startDate ? task.startDate.split('T')[0] : '',
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        }
      : undefined,
  });

  // Update Task Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await taskService.updateTask(id!, data);
    },
    onSuccess: (res) => {
      success('İş başarıyla güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsEditModalOpen(false);
    },
    onError: (err: any) => {
      toastError(err.message || 'Güncelleme başarısız.');
    },
  });

  // Quick Status Transition
  const handleQuickStatusChange = (newStatus: string) => {
    updateMutation.mutate({ status: newStatus });
  };

  // Add Note Mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return await noteService.createNote({
        content,
        taskId: id!,
        companyId: task?.companyId,
      });
    },
    onSuccess: () => {
      success('Not eklendi.');
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      setIsAddNoteModalOpen(false);
      setNoteContent('');
    },
    onError: (err: any) => {
      toastError(err.message || 'Not eklenemedi.');
    },
  });

  if (isLoading) {
    return <LoadingState message="İş detayları getiriliyor..." />;
  }

  if (isError || !task) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-900">İş Kaydı Bulunamadı</h3>
        <Button size="sm" className="mt-4" onClick={() => navigate('/tasks')}>
          İş Listesine Dön
        </Button>
      </div>
    );
  }

  const statuses = [
    'Pending',
    'Analysis',
    'Planned',
    'Development',
    'Testing',
    'Customer Approval',
    'Completed',
    'Cancelled',
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link to="/tasks" className="hover:text-brand-600">
          İşler
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/companies/${task.companyId}`} className="hover:text-brand-600">
          {task.company?.companyName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-bold truncate max-w-xs">{task.title}</span>
      </div>

      {/* Task Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              <Link
                to={`/companies/${task.companyId}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg hover:bg-brand-100 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5" /> {task.company?.companyName}
              </Link>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {task.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit className="w-3.5 h-3.5" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Düzenle
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
              onClick={() => setIsAddNoteModalOpen(true)}
            >
              Not Ekle
            </Button>
          </div>
        </div>

        {/* Quick Status Workflow Progress Ribbon */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            İş Durumu Akışı
          </div>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((st) => {
              const isCurrent = task.status === st;
              return (
                <button
                  key={st}
                  onClick={() => handleQuickStatusChange(st)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {st === 'Pending'
                    ? 'Beklemede'
                    : st === 'Analysis'
                    ? 'Analiz'
                    : st === 'Planned'
                    ? 'Planlandı'
                    : st === 'Development'
                    ? 'Geliştirmede'
                    : st === 'Testing'
                    ? 'Test Aşamasında'
                    : st === 'Customer Approval'
                    ? 'Müşteri Onayında'
                    : st === 'Completed'
                    ? 'Tamamlandı'
                    : 'İptal'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Notes on left, Metadata & Timeline on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader title="İş / Görev Tanımı" />
            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
              {task.description || 'Detaylı bir görev tanımı girilmemiş.'}
            </div>
          </Card>

          {/* Notes & Comments */}
          <Card>
            <CardHeader
              title="İş Notları & Geliştirme Yorumları"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                  onClick={() => setIsAddNoteModalOpen(true)}
                >
                  Yorum Yaz
                </Button>
              }
            />

            {!task.notes || task.notes.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Bu görev için henüz not veya yorum eklenmemiş.
              </div>
            ) : (
              <div className="space-y-3">
                {task.notes.map((note) => (
                  <div key={note.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-800">{note.creator?.name}</span>
                      <span className="text-[11px] text-slate-400">{formatDateTime(note.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Metadata & Activity history */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card>
            <CardHeader title="Görev Detayları" />
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Sorumlu Geliştirici</span>
                <span className="font-bold text-slate-800">
                  {task.assignedUser?.name || 'Atanmamış'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Oluşturan</span>
                <span className="font-semibold text-slate-800">{task.creator?.name || 'Sistem'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Başlangıç Tarihi</span>
                <span className="font-semibold text-slate-800">{formatDate(task.startDate)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Hedef Tarih</span>
                <span className="font-semibold text-slate-800">{formatDate(task.dueDate)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Oluşturulma</span>
                <span className="font-semibold text-slate-800">{formatDate(task.createdAt)}</span>
              </div>
            </div>
          </Card>

          {/* Activity Timeline for this Task */}
          <Card>
            <CardHeader title="İşlem Geçmişi" subtitle="Durum ve güncelleme kayıtları" />
            <ActivityTimeline activities={task.activities || []} />
          </Card>
        </div>
      </div>

      {/* Edit Task Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="İş Kaydını Düzenle"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
          <Input label="İş Başlığı" required error={errors.title?.message} {...register('title')} />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Durum" {...register('status')}>
              <option value="Pending">Beklemede</option>
              <option value="Analysis">Analiz</option>
              <option value="Planned">Planlandı</option>
              <option value="Development">Geliştirmede</option>
              <option value="Testing">Testte</option>
              <option value="Customer Approval">Müşteri Onayı</option>
              <option value="Completed">Tamamlandı</option>
              <option value="Cancelled">İptal</option>
            </Select>

            <Select label="Öncelik" {...register('priority')}>
              <option value="Urgent">Acil</option>
              <option value="High">Yüksek</option>
              <option value="Medium">Orta</option>
              <option value="Low">Düşük</option>
            </Select>
          </div>

          <Select label="Atanan Sorumlu" {...register('assignedUserId')}>
            <option value="">-- Sorumlu Yok --</option>
            {users?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Başlangıç Tarihi" type="date" {...register('startDate')} />
            <Input label="Hedef Tarih" type="date" {...register('dueDate')} />
          </div>

          <Textarea label="Açıklama" rows={3} {...register('description')} />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              İptal
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        title="Görev Notu Ekle"
        maxWidth="md"
      >
        <div className="space-y-4">
          <Textarea
            label="Yorum / Not İçeriği"
            placeholder="Teknik detay, karşılaşılan durum veya bilgi..."
            rows={4}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddNoteModalOpen(false)}>
              İptal
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!noteContent.trim()}
              isLoading={addNoteMutation.isPending}
              onClick={() => addNoteMutation.mutate(noteContent)}
            >
              Kaydet
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
