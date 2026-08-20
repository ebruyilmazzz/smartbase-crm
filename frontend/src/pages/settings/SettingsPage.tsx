import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  Layers,
  Flame,
  Plus,
  Edit,
  Shield,
  UserCheck,
  Code,
  CheckCircle2,
  XCircle,
  Lock,
} from 'lucide-react';
import { settingsService } from '../../services/settings.service.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Card, CardHeader } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { Select } from '../../components/common/Select.js';
import { Tabs } from '../../components/common/Tabs.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { formatDate } from '../../utils/formatters.js';

// Schemas
const userSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır.'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'SALES', 'DEVELOPER']),
  status: z.enum(['ACTIVE', 'DISABLED']),
});

const statusSchema = z.object({
  name: z.string().min(2, 'Durum adı zorunludur.'),
  category: z.enum(['COMPANY', 'TASK', 'REQUEST']),
  color: z.string().optional(),
  order: z.number().default(0),
});

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const { isAdmin } = useAuth();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await settingsService.getUsers();
      return res.data;
    },
    enabled: isAdmin,
  });

  const { data: statuses, isLoading: isStatusesLoading } = useQuery({
    queryKey: ['adminStatuses'],
    queryFn: async () => {
      const res = await settingsService.getStatuses();
      return res.data;
    },
  });

  const { data: priorities } = useQuery({
    queryKey: ['adminPriorities'],
    queryFn: async () => {
      const res = await settingsService.getPriorities();
      return res.data;
    },
  });

  // User Form
  const {
    register: registerUser,
    handleSubmit: handleUserSubmit,
    reset: resetUser,
    formState: { errors: userErrors, isSubmitting: isUserSubmitting },
  } = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'SALES',
      status: 'ACTIVE',
    },
  });

  // User Mutations
  const saveUserMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        return await settingsService.updateUser(editingUser.id, payload);
      }
      return await settingsService.createUser(formData);
    },
    onSuccess: () => {
      success(editingUser ? 'Kullanıcı güncellendi.' : 'Yeni kullanıcı oluşturuldu.');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setIsUserModalOpen(false);
      setEditingUser(null);
      resetUser();
    },
    onError: (err: any) => {
      toastError(err.message || 'Kullanıcı işlemi başarısız.');
    },
  });

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-900">Erişim Yetkisi Yok</h3>
        <p className="text-xs text-slate-500 mt-1">
          Ayarlar ve kullanıcı yönetimi yalnızca Yönetici (Admin) rolüne sahip kullanıcılar içindir.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'users', label: 'Kullanıcı Yönetimi', icon: <Users className="w-4 h-4" />, badge: users?.length },
    { id: 'statuses', label: 'Durum Tanımları', icon: <Layers className="w-4 h-4" /> },
    { id: 'priorities', label: 'Öncelik Seviyeleri', icon: <Flame className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sistem Ayarları & Yönetim</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          CRM kullanıcıları, roller, yetkiler ve dinamik sistem durumları
        </p>
      </div>

      {/* Tabs Nav */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">CRM Kullanıcıları & Rolleri</h3>
              <p className="text-xs text-slate-500">Sisteme erişebilen personel listesi ve yetki düzeyleri</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                setEditingUser(null);
                resetUser({
                  name: '',
                  email: '',
                  password: '',
                  role: 'SALES',
                  status: 'ACTIVE',
                });
                setIsUserModalOpen(true);
              }}
            >
              Yeni Kullanıcı Ekle
            </Button>
          </div>

          {isUsersLoading ? (
            <LoadingState message="Kullanıcılar listeleniyor..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-5">Kullanıcı Adı</th>
                    <th className="py-3 px-4">E-posta</th>
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-4">Hesap Durumu</th>
                    <th className="py-3 px-4">Atanmış İş / Talep</th>
                    <th className="py-3 px-4">Kayıt Tarihi</th>
                    <th className="py-3 px-5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users?.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                          {u.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">{u.email}</td>
                      <td className="py-3.5 px-4">
                        {u.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            <Shield className="w-3 h-3" /> Yönetici (Admin)
                          </span>
                        ) : u.role === 'DEVELOPER' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            <Code className="w-3 h-3" /> Geliştirici
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <UserCheck className="w-3 h-3" /> Satış / Temsilci
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                            <XCircle className="w-3.5 h-3.5 text-slate-400" /> Devre Dışı
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {u._count?.assignedTasks || 0} İş • {u._count?.assignedRequests || 0} Talep
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                      <td className="py-3.5 px-5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Edit className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setEditingUser(u);
                            resetUser({
                              name: u.name,
                              email: u.email,
                              password: '',
                              role: u.role,
                              status: u.status,
                            });
                            setIsUserModalOpen(true);
                          }}
                        >
                          Düzenle
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: STATUSES */}
      {activeTab === 'statuses' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['COMPANY', 'TASK', 'REQUEST'].map((cat) => {
            const catStatuses = statuses?.filter((s) => s.category === cat) || [];
            const catTitle =
              cat === 'COMPANY'
                ? 'Müşteri Durumları'
                : cat === 'TASK'
                ? 'İş & Görev Durumları'
                : 'Müşteri Talep Durumları';

            return (
              <Card key={cat}>
                <CardHeader title={catTitle} subtitle={`${catStatuses.length} tanımlı durum`} />
                <div className="space-y-2">
                  {catStatuses.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: st.color || '#94a3b8' }}
                        />
                        <span className="font-semibold text-slate-800">{st.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">Sıra: {st.order}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 3: PRIORITIES */}
      {activeTab === 'priorities' && (
        <Card className="max-w-2xl">
          <CardHeader
            title="Öncelik Seviyeleri"
            subtitle="Sistem genelinde kullanılan standart önem dereceleri"
          />
          <div className="space-y-3">
            {priorities?.map((pr) => (
              <div
                key={pr.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800">{pr.name}</span>
                  <span className="text-slate-400 font-medium">Renk Kodu: {pr.color}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Öncelik Sırası: #{pr.order}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* User Create / Edit Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? 'Kullanıcı Bilgilerini Düzenle' : 'Yeni Kullanıcı Oluştur'}
        maxWidth="md"
      >
        <form onSubmit={handleUserSubmit((d) => saveUserMutation.mutate(d))} className="space-y-4">
          <Input label="Ad Soyad" required error={userErrors.name?.message} {...registerUser('name')} />
          <Input label="E-posta Adresi" type="email" required error={userErrors.email?.message} {...registerUser('email')} />

          <Input
            label={editingUser ? 'Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)' : 'Şifre'}
            type="password"
            required={!editingUser}
            error={userErrors.password?.message}
            {...registerUser('password')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Kullanıcı Rolü" {...registerUser('role')}>
              <option value="SALES">Satış / Müşteri Temsilcisi</option>
              <option value="DEVELOPER">Yazılım Geliştirici</option>
              <option value="ADMIN">Yönetici (Admin)</option>
            </Select>

            <Select label="Hesap Durumu" {...registerUser('status')}>
              <option value="ACTIVE">Aktif</option>
              <option value="DISABLED">Devre Dışı</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>
              İptal
            </Button>
            <Button type="submit" variant="primary" isLoading={isUserSubmitting}>
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
