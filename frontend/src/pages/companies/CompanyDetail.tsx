import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  User,
  Plus,
  Edit,
  FolderPlus,
  Flame,
  MessageSquare,
  Activity as ActivityIcon,
  CheckSquare,
  Trash2,
  Star,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { companyService } from '../../services/company.service.js';
import { taskService } from '../../services/task.service.js';
import { requestService } from '../../services/request.service.js';
import { noteService } from '../../services/note.service.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Card, CardHeader } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { Textarea } from '../../components/common/Textarea.js';
import { Select } from '../../components/common/Select.js';
import { Tabs } from '../../components/common/Tabs.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { PriorityBadge } from '../../components/common/PriorityBadge.js';
import { Modal } from '../../components/common/Modal.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { ActivityTimeline } from '../../components/activity/ActivityTimeline.js';
import { formatDate, formatDateTime, formatRelativeTime } from '../../utils/formatters.js';

// Schemas
const companyEditSchema = z.object({
  companyName: z.string().min(2, 'Şirket adı zorunludur.'),
  status: z.string(),
  industry: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Geçerli e-posta').optional().or(z.literal('')),
  website: z.string().optional(),
  taxNumber: z.string().optional(),
  currentSoftware: z.string().optional(),
  eInvoiceStatus: z.string(),
  eLedgerStatus: z.string(),
  address: z.string().optional(),
  description: z.string().optional(),
});

const contactSchema = z.object({
  name: z.string().min(2, 'İsim zorunludur.'),
  position: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Geçerli e-posta').optional().or(z.literal('')),
  isPrimary: z.boolean().default(false),
});

const taskModalSchema = z.object({
  title: z.string().min(2, 'İş başlığı zorunludur.'),
  description: z.string().optional(),
  status: z.string().default('Pending'),
  priority: z.string().default('Medium'),
  assignedUserId: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

const requestModalSchema = z.object({
  title: z.string().min(2, 'Talep başlığı zorunludur.'),
  description: z.string().min(5, 'Açıklama en az 5 karakter olmalıdır.'),
  requestedBy: z.string().optional(),
  priority: z.string().default('Medium'),
  status: z.string().default('New'),
  assignedUserId: z.string().optional(),
});

const noteModalSchema = z.object({
  content: z.string().min(1, 'Not içeriği zorunludur.'),
});

export const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);

  const { user, isAdmin, isSales } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch company details
  const { data: company, isLoading, isError } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      if (!id) throw new Error('Geçersiz ID');
      const res = await companyService.getCompany(id);
      return res.data;
    },
    enabled: !!id,
  });

  // Edit Company Form
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { isSubmitting: isEditSubmitting, errors: editErrors },
  } = useForm<z.infer<typeof companyEditSchema>>({
    resolver: zodResolver(companyEditSchema),
    values: company ? {
      companyName: company.companyName,
      status: company.status,
      industry: company.industry || '',
      phone: company.phone || '',
      email: company.email || '',
      website: company.website || '',
      taxNumber: company.taxNumber || '',
      currentSoftware: company.currentSoftware || '',
      eInvoiceStatus: company.eInvoiceStatus || 'Hayır',
      eLedgerStatus: company.eLedgerStatus || 'Hayır',
      address: company.address || '',
      description: company.description || '',
    } : undefined,
  });

  // Contact Form
  const {
    register: registerContact,
    handleSubmit: handleContactSubmit,
    reset: resetContact,
    formState: { isSubmitting: isContactSubmitting },
  } = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
  });

  // Task Form
  const {
    register: registerTask,
    handleSubmit: handleTaskSubmit,
    reset: resetTask,
    formState: { isSubmitting: isTaskSubmitting, errors: taskErrors },
  } = useForm<z.infer<typeof taskModalSchema>>({
    resolver: zodResolver(taskModalSchema),
    defaultValues: {
      status: 'Pending',
      priority: 'Medium',
    },
  });

  // Request Form
  const {
    register: registerRequest,
    handleSubmit: handleRequestSubmit,
    reset: resetRequest,
    formState: { isSubmitting: isRequestSubmitting, errors: requestErrors },
  } = useForm<z.infer<typeof requestModalSchema>>({
    resolver: zodResolver(requestModalSchema),
    defaultValues: {
      status: 'New',
      priority: 'Medium',
    },
  });

  // Note Form
  const {
    register: registerNote,
    handleSubmit: handleNoteSubmit,
    reset: resetNote,
    formState: { isSubmitting: isNoteSubmitting },
  } = useForm<z.infer<typeof noteModalSchema>>({
    resolver: zodResolver(noteModalSchema),
  });

  // Mutations
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: any) => companyService.updateCompany(id!, data),
    onSuccess: () => {
      success('Müşteri bilgileri güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsEditModalOpen(false);
    },
    onError: (err: any) => toastError(err.message || 'Güncelleme başarısız.'),
  });

  const saveContactMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingContact) {
        return await companyService.updateContact(editingContact.id, data);
      }
      return await companyService.addContact(id!, data);
    },
    onSuccess: () => {
      success(editingContact ? 'Yetkili güncellendi.' : 'Yeni yetkili eklendi.');
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      setIsContactModalOpen(false);
      setEditingContact(null);
      resetContact();
    },
    onError: (err: any) => toastError(err.message || 'Yetkili kaydedilemedi.'),
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => companyService.deleteContact(contactId),
    onSuccess: () => {
      success('Yetkili silindi.');
      queryClient.invalidateQueries({ queryKey: ['company', id] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => taskService.createTask({ ...data, companyId: id! }),
    onSuccess: () => {
      success('Yeni iş oluşturuldu.');
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsNewTaskModalOpen(false);
      resetTask();
    },
    onError: (err: any) => toastError(err.message || 'İş oluşturulamadı.'),
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => requestService.createRequest({ ...data, companyId: id! }),
    onSuccess: () => {
      success('Müşteri talebi açıldı.');
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsNewRequestModalOpen(false);
      resetRequest();
    },
    onError: (err: any) => toastError(err.message || 'Talep açılamadı.'),
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: any) => noteService.createNote({ content: data.content, companyId: id! }),
    onSuccess: () => {
      success('Not eklendi.');
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      setIsAddNoteModalOpen(false);
      resetNote();
    },
    onError: (err: any) => toastError(err.message || 'Not eklenemedi.'),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => noteService.deleteNote(noteId),
    onSuccess: () => {
      success('Not silindi.');
      queryClient.invalidateQueries({ queryKey: ['company', id] });
    },
  });

  if (isLoading) {
    return <LoadingState message="Müşteri detayları ve veritabanı ilişkileri yükleniyor..." />;
  }

  if (isError || !company) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-900">Müşteri Bulunamadı</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Aradığınız müşteri kaydı silinmiş veya erişim yetkiniz bulunmuyor olabilir.
        </p>
        <Button size="sm" onClick={() => navigate('/companies')}>
          Müşteri Listesine Dön
        </Button>
      </div>
    );
  }

  const primaryContact = company.contacts?.find((c) => c.isPrimary) || company.contacts?.[0];
  const openTasksCount = company.tasks?.filter((t) => !['Completed', 'Tamamlandı', 'Cancelled', 'İptal'].includes(t.status)).length || 0;
  const completedTasksCount = company.tasks?.filter((t) => ['Completed', 'Tamamlandı'].includes(t.status)).length || 0;
  const openRequestsCount = company.customerRequests?.filter((r) => !['Completed', 'Tamamlandı', 'Cancelled', 'İptal'].includes(r.status)).length || 0;

  const tabs = [
    { id: 'overview', label: 'Genel Bakış', icon: <Building2 className="w-4 h-4" /> },
    {
      id: 'tasks',
      label: 'İşler & Geliştirmeler',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: company.tasks?.length || 0,
    },
    {
      id: 'requests',
      label: 'Talepler',
      icon: <Flame className="w-4 h-4" />,
      badge: company.customerRequests?.length || 0,
    },
    {
      id: 'activities',
      label: 'Aktiviteler',
      icon: <ActivityIcon className="w-4 h-4" />,
      badge: company.activities?.length || 0,
    },
    {
      id: 'notes',
      label: 'Notlar',
      icon: <MessageSquare className="w-4 h-4" />,
      badge: company.notes?.length || 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link to="/companies" className="hover:text-brand-600">
          Müşteriler
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-bold">{company.companyName}</span>
      </div>

      {/* Main Company Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-md shadow-brand-500/20 shrink-0">
              {company.companyName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {company.companyName}
                </h1>
                <StatusBadge status={company.status} />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                {company.industry && (
                  <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {company.industry}
                  </span>
                )}
                {company.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {company.phone}
                  </span>
                )}
                {company.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {company.email}
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-brand-600 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" /> {company.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {(isAdmin || isSales) && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit className="w-3.5 h-3.5" />}
                onClick={() => setIsEditModalOpen(true)}
              >
                Düzenle
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FolderPlus className="w-3.5 h-3.5 text-indigo-600" />}
              onClick={() => setIsNewTaskModalOpen(true)}
            >
              Yeni İş
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Flame className="w-3.5 h-3.5 text-rose-600" />}
              onClick={() => setIsNewRequestModalOpen(true)}
            >
              Yeni Talep
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

        {/* Tab Header Navigation */}
        <div className="mt-6 -mb-6">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* Tab Contents */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* CRM Quick Stat Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Toplam İş</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{company.tasks?.length || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-bold text-indigo-600 uppercase">Açık / Devam Eden İş</div>
              <div className="text-2xl font-black text-indigo-600 mt-1">{openTasksCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-bold text-emerald-600 uppercase">Tamamlanan İş</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{completedTasksCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-bold text-rose-600 uppercase">Bekleyen Talepler</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{openRequestsCount}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Company & System Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Business Description */}
              <Card>
                <CardHeader title="Müşteri Faaliyet Alanı & İhtiyaç Özeti" />
                <p className="text-xs text-slate-700 leading-relaxed">
                  {company.description || 'Henüz şirket ve faaliyet açıklaması girilmemiş.'}
                </p>
              </Card>

              {/* Technical & Software Infrastructure */}
              <Card>
                <CardHeader title="Yazılım ve Entegrasyon Altyapısı" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Mevcut Yazılım / ERP</span>
                    <span className="font-bold text-slate-800">{company.currentSoftware || 'Belirtilmedi'}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">E-Fatura Durumu</span>
                    <span className="font-bold text-slate-800">{company.eInvoiceStatus || 'Hayır'}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">E-Defter Durumu</span>
                    <span className="font-bold text-slate-800">{company.eLedgerStatus || 'Hayır'}</span>
                  </div>
                </div>
              </Card>

              {/* Recent Tasks Snapshot */}
              <Card>
                <CardHeader
                  title="Devam Eden İşler"
                  action={
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Tümünü Gör ({company.tasks?.length || 0})
                    </button>
                  }
                />
                {!company.tasks || company.tasks.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">Bu müşteriye ait henüz iş açılmamış.</div>
                ) : (
                  <div className="space-y-2">
                    {company.tasks.slice(0, 4).map((task) => (
                      <div
                        key={task.id}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="text-xs font-bold text-slate-900 truncate">{task.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Sorumlu: {task.assignedUser?.name || 'Atanmamış'} • Hedef: {formatDate(task.dueDate)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <PriorityBadge priority={task.priority} />
                          <StatusBadge status={task.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right 1 Col: Contacts & Metadata */}
            <div className="space-y-6">
              {/* Contacts Card */}
              <Card>
                <CardHeader
                  title="Şirket Yetkilileri"
                  action={
                    (isAdmin || isSales) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setEditingContact(null);
                          resetContact({ isPrimary: false });
                          setIsContactModalOpen(true);
                        }}
                      >
                        Yetkili Ekle
                      </Button>
                    )
                  }
                />

                {!company.contacts || company.contacts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">Yetkili kişi kaydedilmemiş.</div>
                ) : (
                  <div className="space-y-3">
                    {company.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-3 rounded-xl border transition-all ${
                          contact.isPrimary
                            ? 'bg-brand-50/40 border-brand-200/80'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">{contact.name}</span>
                              {contact.isPrimary && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                  <Star className="w-2.5 h-2.5 fill-current" /> Birincil
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                              {contact.position || 'Yetkili'}
                            </div>
                          </div>

                          {(isAdmin || isSales) && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingContact(contact);
                                  resetContact({
                                    name: contact.name,
                                    position: contact.position || '',
                                    phone: contact.phone || '',
                                    email: contact.email || '',
                                    isPrimary: contact.isPrimary,
                                  });
                                  setIsContactModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteContactMutation.mutate(contact.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-200/50 space-y-1 text-[11px] text-slate-600">
                          {contact.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <a href={`tel:${contact.phone}`} className="hover:text-brand-600 font-medium">
                                {contact.phone}
                              </a>
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <a href={`mailto:${contact.email}`} className="hover:text-brand-600">
                                {contact.email}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Company Info Box */}
              <Card>
                <CardHeader title="Kurumsal Bilgiler" />
                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">Vergi No</span>
                    <span className="font-semibold text-slate-800">{company.taxNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">Kayıt Tarihi</span>
                    <span className="font-semibold text-slate-800">{formatDate(company.createdAt)}</span>
                  </div>
                  <div className="py-1">
                    <span className="text-slate-400 font-medium block mb-1">Açık Adres</span>
                    <span className="font-medium text-slate-800 leading-relaxed block bg-slate-50 p-2 rounded">
                      {company.address || 'Adres bilgisi eklenmemiş.'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 2. TASKS TAB */}
      {activeTab === 'tasks' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">İşler ve Yazılım Geliştirme Görevleri</h3>
              <p className="text-xs text-slate-500">Bu müşteriye atanmış tüm işler ve tamamlanma durumları</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                resetTask();
                setIsNewTaskModalOpen(true);
              }}
            >
              Yeni İş Aç
            </Button>
          </div>

          {!company.tasks || company.tasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Bu müşteriye ait henüz iş kaydı açılmamış.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-5">İş Başlığı</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4">Öncelik</th>
                    <th className="py-3 px-4">Sorumlu Geliştirici</th>
                    <th className="py-3 px-4">Başlangıç</th>
                    <th className="py-3 px-5 text-right">Hedef Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {company.tasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-5 font-bold text-slate-900 group-hover:text-brand-600">
                        {task.title}
                        {task.description && (
                          <p className="text-[11px] text-slate-500 font-normal truncate max-w-md mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {task.assignedUser?.name || 'Atanmamış'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(task.startDate)}
                      </td>
                      <td className="py-3.5 px-5 text-right text-slate-500 whitespace-nowrap font-medium">
                        {formatDate(task.dueDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* 3. REQUESTS TAB */}
      {activeTab === 'requests' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Müşteri Talepleri ve Sorun Bildirimleri</h3>
              <p className="text-xs text-slate-500">Müşteriden iletilen talepler, çözüm aşamaları ve durumlar</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                resetRequest();
                setIsNewRequestModalOpen(true);
              }}
            >
              Yeni Talep Gir
            </Button>
          </div>

          {!company.customerRequests || company.customerRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Bu müşteri için henüz iletilmiş bir talep bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-5">Talep Başlığı & Açıklama</th>
                    <th className="py-3 px-4">Talep Eden</th>
                    <th className="py-3 px-4">Öncelik</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4">Atanan Sorumlu</th>
                    <th className="py-3 px-5 text-right">Kayıt Tarihi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {company.customerRequests.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => navigate(`/requests/${req.id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 group-hover:text-brand-600">{req.title}</div>
                        <p className="text-[11px] text-slate-500 truncate max-w-md mt-0.5">{req.description}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                        {req.requestedBy || 'Belirtilmedi'}
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={req.priority} />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {req.assignedUser?.name || 'Atanmamış'}
                      </td>
                      <td className="py-3.5 px-5 text-right text-slate-500 whitespace-nowrap">
                        {formatDate(req.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* 4. ACTIVITIES TAB */}
      {activeTab === 'activities' && (
        <Card>
          <CardHeader
            title="Müşteri Aktivite Geçmişi"
            subtitle="Bu müşteriye bağlı oluşturulan tüm iş, talep, durum ve not kayıtlarının zaman çizelgesi"
          />
          <ActivityTimeline activities={company.activities || []} />
        </Card>
      )}

      {/* 5. NOTES TAB */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">İç Notlar & Ekip Notları</h3>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                resetNote();
                setIsAddNoteModalOpen(true);
              }}
            >
              Not Ekle
            </Button>
          </div>

          {!company.notes || company.notes.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-xs text-slate-400">
                Henüz bu müşteri için eklenmiş bir not bulunmuyor.
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {company.notes.map((note) => (
                <Card key={note.id} className="relative group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                        {note.creator?.name?.slice(0, 1) || 'U'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800">{note.creator?.name}</span>
                        <span className="text-[10px] text-slate-400 block">{formatDateTime(note.createdAt)}</span>
                      </div>
                    </div>

                    {(user?.id === note.createdById || isAdmin) && (
                      <button
                        onClick={() => deleteNoteMutation.mutate(note.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                        title="Notu Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {note.content}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Company Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Müşteri Bilgilerini Düzenle"
        maxWidth="2xl"
      >
        <form onSubmit={handleEditSubmit((d) => updateCompanyMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Şirket Adı"
              required
              error={editErrors.companyName?.message}
              {...registerEdit('companyName')}
            />
            <Select label="Müşteri Durumu" {...registerEdit('status')}>
              <option value="Active">Aktif</option>
              <option value="Lead">Aday (Lead)</option>
              <option value="Analysis">Analiz Aşamasında</option>
              <option value="Passive">Pasif</option>
              <option value="Completed">Tamamlandı</option>
            </Select>

            <Input label="Sektör" {...registerEdit('industry')} />
            <Input label="Şirket Telefonu" {...registerEdit('phone')} />
            <Input label="Şirket E-posta" type="email" {...registerEdit('email')} />
            <Input label="Web Sitesi" {...registerEdit('website')} />
            <Input label="Vergi Numarası" {...registerEdit('taxNumber')} />
            <Input label="Mevcut Yazılım / Muhasebe" {...registerEdit('currentSoftware')} />

            <Select label="E-Fatura Durumu" {...registerEdit('eInvoiceStatus')}>
              <option value="Evet">Evet</option>
              <option value="Hayır">Hayır</option>
              <option value="Süreçte">Süreçte</option>
            </Select>
            <Select label="E-Defter Durumu" {...registerEdit('eLedgerStatus')}>
              <option value="Evet">Evet</option>
              <option value="Hayır">Hayır</option>
              <option value="Süreçte">Süreçte</option>
            </Select>
          </div>

          <Input label="Adres" {...registerEdit('address')} />
          <Textarea label="Faaliyet Alanı ve Açıklama" rows={3} {...registerEdit('description')} />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              İptal
            </Button>
            <Button type="submit" variant="primary" isLoading={isEditSubmitting}>
              Değişiklikleri Kaydet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Contact Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          setEditingContact(null);
        }}
        title={editingContact ? 'Yetkiliyi Düzenle' : 'Yeni Yetkili Ekle'}
        maxWidth="md"
      >
        <form onSubmit={handleContactSubmit((d) => saveContactMutation.mutate(d))} className="space-y-4">
          <Input label="Yetkili Adı Soyadı" required {...registerContact('name')} />
          <Input label="Görevi / Pozisyonu" placeholder="Örn: Üretim Müdürü" {...registerContact('position')} />
          <Input label="Telefon Numarası" placeholder="+90 532 000 0000" {...registerContact('phone')} />
          <Input label="E-posta Adresi" type="email" placeholder="yetkili@sirket.com" {...registerContact('email')} />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPrimary"
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              {...registerContact('isPrimary')}
            />
            <label htmlFor="isPrimary" className="text-xs font-semibold text-slate-700">
              Bu kişiyi birincil yetkili olarak işaretle
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsContactModalOpen(false);
                setEditingContact(null);
              }}
            >
              İptal
            </Button>
            <Button type="submit" variant="primary" isLoading={isContactSubmitting}>
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Task Modal */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title={`Yeni İş / Görev Aç (${company.companyName})`}
        maxWidth="lg"
      >
        <form onSubmit={handleTaskSubmit((d) => createTaskMutation.mutate(d))} className="space-y-4">
          <Input
            label="İş Başlığı"
            placeholder="Örn: CNC Üretim Entegrasyonu"
            required
            error={taskErrors.title?.message}
            {...registerTask('title')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Durum" {...registerTask('status')}>
              <option value="Pending">Beklemede</option>
              <option value="Analysis">Analiz</option>
              <option value="Planned">Planlandı</option>
              <option value="Development">Geliştirmede</option>
              <option value="Testing">Testte</option>
              <option value="Customer Approval">Müşteri Onayında</option>
              <option value="Completed">Tamamlandı</option>
            </Select>

            <Select label="Öncelik" {...registerTask('priority')}>
              <option value="Urgent">Acil</option>
              <option value="High">Yüksek</option>
              <option value="Medium">Orta</option>
              <option value="Low">Düşük</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Başlangıç Tarihi" type="date" {...registerTask('startDate')} />
            <Input label="Hedef Bitiş Tarihi" type="date" {...registerTask('dueDate')} />
          </div>

          <Textarea
            label="İş Tanımı ve Detayları"
            rows={3}
            placeholder="Geliştirme hedefleri, gereksinimler..."
            {...registerTask('description')}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsNewTaskModalOpen(false)}>
              İptal
            </Button>
            <Button type="submit" variant="primary" isLoading={isTaskSubmitting}>
              İşi Oluştur
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Request Modal */}
      <Modal
        isOpen={isNewRequestModalOpen}
        onClose={() => setIsNewRequestModalOpen(false)}
        title={`Yeni Müşteri Talebi Aç (${company.companyName})`}
        maxWidth="lg"
      >
        <form onSubmit={handleRequestSubmit((d) => createRequestMutation.mutate(d))} className="space-y-4">
          <Input
            label="Talep Başlığı"
            placeholder="Örn: E-Fatura QR Kod Entegrasyonu"
            required
            error={requestErrors.title?.message}
            {...registerRequest('title')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Talep Eden Kişi"
              placeholder="Örn: Hasan Bey"
              {...registerRequest('requestedBy')}
            />

            <Select label="Öncelik" {...registerRequest('priority')}>
              <option value="Urgent">Acil</option>
              <option value="High">Yüksek</option>
              <option value="Medium">Orta</option>
              <option value="Low">Düşük</option>
            </Select>
          </div>

          <Textarea
            label="Talep Açıklaması"
            required
            rows={3}
            placeholder="Müşterinin ilettiği detaylı istek veya problem..."
            error={requestErrors.description?.message}
            {...registerRequest('description')}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsNewRequestModalOpen(false)}>
              İptal
            </Button>
            <Button type="submit" variant="primary" isLoading={isRequestSubmitting}>
              Talebi Kaydet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        title={`Yeni Not Ekle (${company.companyName})`}
        maxWidth="md"
      >
        <form onSubmit={handleNoteSubmit((d) => createNoteMutation.mutate(d))} className="space-y-4">
          <Textarea
            label="Not İçeriği"
            placeholder="Müşteri görüşmesi, alınan kararlar veya dahili hatırlatıcı..."
            rows={4}
            required
            {...registerNote('content')}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddNoteModalOpen(false)}>
              İptal
            </Button>
            <Button type="submit" variant="primary" isLoading={isNoteSubmitting}>
              Notu Kaydet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
