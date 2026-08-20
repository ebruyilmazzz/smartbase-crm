import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Flame,
  Building2,
  Calendar,
  User,
  Edit,
  Clock,
  MessageSquare,
  Activity as ActivityIcon,
  ChevronRight,
  CheckCircle2,
  Check,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { requestService } from '../../services/request.service.js';
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

const editRequestSchema = z.object({
  title: z.string().min(2, 'Talep başlığı zorunludur.'),
  description: z.string().min(5, 'Açıklama gereklidir.'),
  requestedBy: z.string().optional().nullable(),
  priority: z.string(),
  status: z.string(),
  assignedUserId: z.string().optional().nullable(),
  solution: z.string().optional().nullable(),
});

export const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [solutionInput, setSolutionInput] = useState('');
  const [isEditingSolution, setIsEditingSolution] = useState(false);

  const { user, isAdmin, isSales, isDeveloper } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch Request
  const { data: request, isLoading, isError } = useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      if (!id) throw new Error('Geçersiz ID');
      const res = await requestService.getRequest(id);
      return res.data;
    },
    enabled: !!id,
  });

  // Fetch Users
  const { data: users } = useQuery({
    queryKey: ['usersDropdown'],
    queryFn: async () => {
      const res = await settingsService.getUsers();
      return res.data;
    },
  });

  // Edit Request Form
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<z.infer<typeof editRequestSchema>>({
    resolver: zodResolver(editRequestSchema),
    values: request
      ? {
          title: request.title,
          description: request.description,
          requestedBy: request.requestedBy || '',
          priority: request.priority,
          status: request.status,
          assignedUserId: request.assignedUserId || '',
          solution: request.solution || '',
        }
      : undefined,
  });

  // Update Request Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await requestService.updateRequest(id!, data);
    },
    onSuccess: (res) => {
      success('Talep başarıyla güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsEditModalOpen(false);
      setIsEditingSolution(false);
    },
    onError: (err: any) => {
      toastError(err.message || 'Güncelleme başarısız.');
    },
  });

  // Quick Status change
  const handleQuickStatusChange = (newStatus: string) => {
    updateMutation.mutate({ status: newStatus });
  };

  // Add Note Mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return await noteService.createNote({
        content,
        requestId: id!,
        companyId: request?.companyId,
      });
    },
    onSuccess: () => {
      success('Not eklendi.');
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      setIsAddNoteModalOpen(false);
      setNoteContent('');
    },
    onError: (err: any) => {
      toastError(err.message || 'Not eklenemedi.');
    },
  });

  if (isLoading) {
    return <LoadingState message="Müşteri talebi detayları getiriliyor..." />;
  }

  if (isError || !request) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-900">Talep Kaydı Bulunamadı</h3>
        <Button size="sm" className="mt-4" onClick={() => navigate('/requests')}>
          Talep Listesine Dön
        </Button>
      </div>
    );
  }

  const statuses = [
    'New',
    'Analysis',
    'Development',
    'Waiting for Customer',
    'Completed',
    'Cancelled',
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link to="/requests" className="hover:text-brand-600">
          Talepler
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/companies/${request.companyId}`} className="hover:text-brand-600">
          {request.company?.companyName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-bold truncate max-w-xs">{request.title}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <PriorityBadge priority={request.priority} />
              <StatusBadge status={request.status} />
              <Link
                to={`/companies/${request.companyId}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg hover:bg-brand-100 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5" /> {request.company?.companyName}
              </Link>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {request.title}
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

        {/* Quick Status Workflow Ribbon */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Talep Durumu
          </div>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((st) => {
              const isCurrent = request.status === st;
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
                  {st === 'New'
                    ? 'Yeni'
                    : st === 'Analysis'
                    ? 'Analiz'
                    : st === 'Development'
                    ? 'Geliştirmede'
                    : st === 'Waiting for Customer'
                    ? 'Müşteri Bekleniyor'
                    : st === 'Completed'
                    ? 'Tamamlandı'
                    : 'İptal'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Description, Solution, Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader title="Talep İhtiyaç Açıklaması" />
            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
              {request.description}
            </div>
          </Card>

          {/* Solution Section */}
          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2 text-emerald-800">
                  <Lightbulb className="w-4 h-4 text-emerald-600" />
                  <span>Çözüm ve Aksiyon Notu</span>
                </div>
              }
              action={
                !isEditingSolution && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Edit className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setSolutionInput(request.solution || '');
                      setIsEditingSolution(true);
                    }}
                  >
                    {request.solution ? 'Çözümü Güncelle' : 'Çözüm Ekle'}
                  </Button>
                )
              }
            />

            {isEditingSolution ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Uygulanan teknik çözüm, geliştirme adımları veya müşteriye iletilen cevap..."
                  rows={4}
                  value={solutionInput}
                  onChange={(e) => setSolutionInput(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditingSolution(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    isLoading={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({ solution: solutionInput })}
                  >
                    Çözümü Kaydet
                  </Button>
                </div>
              </div>
            ) : request.solution ? (
              <div className="text-xs text-emerald-950 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 leading-relaxed whitespace-pre-wrap">
                {request.solution}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                Henüz çözüm açıklaması girilmemiş.
              </div>
            )}
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader
              title="Dahili Notlar & Ekip İletişimi"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                  onClick={() => setIsAddNoteModalOpen(true)}
                >
                  Not Ekle
                </Button>
              }
            />

            {!request.notes || request.notes.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Bu talep için henüz not eklenmemiş.
              </div>
            ) : (
              <div className="space-y-3">
                {request.notes.map((note) => (
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

        {/* Right 1 Col: Metadata & Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Talep Bilgileri" />
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Talep Eden</span>
                <span className="font-bold text-slate-800">{request.requestedBy || 'Belirtilmedi'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Atanan Sorumlu</span>
                <span className="font-bold text-slate-800">{request.assignedUser?.name || 'Atanmamış'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Kaydı Açan</span>
                <span className="font-semibold text-slate-800">{request.creator?.name || 'Sistem'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Kayıt Tarihi</span>
                <span className="font-semibold text-slate-800">{formatDate(request.createdAt)}</span>
              </div>
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader title="İşlem Geçmişi" subtitle="Bu talebe ilişkin sistem logları" />
            <ActivityTimeline activities={request.activities || []} />
          </Card>
        </div>
      </div>

      {/* Edit Request Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Talebi Düzenle"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
          <Input label="Talep Başlığı" required error={errors.title?.message} {...register('title')} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Talep Eden Kişi" {...register('requestedBy')} />
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
              <option value="Cancelled">İptal</option>
            </Select>

            <Select label="Atanan Sorumlu" {...register('assignedUserId')}>
              <option value="">-- Sorumlu Ataması Yok --</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </Select>
          </div>

          <Textarea label="Açıklama" rows={3} required error={errors.description?.message} {...register('description')} />
          <Textarea label="Çözüm Notu" rows={3} {...register('solution')} />

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
        title="Talebe Not Ekle"
        maxWidth="md"
      >
        <div className="space-y-4">
          <Textarea
            label="Not İçeriği"
            placeholder="Görüşme notu veya teknik detay..."
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
