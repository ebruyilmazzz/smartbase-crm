import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  CheckSquare,
  Flame,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { reportService } from '../services/report.service.js';
import { Card, CardHeader } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { PriorityBadge } from '../components/common/PriorityBadge.js';
import { ActivityTimeline } from '../components/activity/ActivityTimeline.js';
import { LoadingState } from '../components/common/LoadingState.js';
import { formatDate } from '../utils/formatters.js';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await reportService.getDashboard();
      return res.data;
    },
  });

  if (isLoading) {
    return <LoadingState message="Dashboard istatistikleri ve veriler yükleniyor..." />;
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-100 shadow-xs">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Veriler Yüklenemedi</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Dashboard verilerini alırken bir sorunla karşılaşıldı.
        </p>
        <Button size="sm" onClick={() => refetch()}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  const { summary, urgentAndPendingTasks, recentRequests, recentActivities } = data;

  const statCards = [
    {
      title: 'Toplam Müşteri',
      value: summary.totalCompanies,
      icon: Building2,
      color: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50 text-blue-700 border-blue-200/60',
      to: '/companies',
    },
    {
      title: 'Aktif Müşteri',
      value: summary.activeCompanies,
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      to: '/companies?status=Active',
    },
    {
      title: 'Açık İşler',
      value: summary.openTasks,
      icon: CheckSquare,
      color: 'from-purple-500 to-indigo-600',
      bg: 'bg-purple-50 text-purple-700 border-purple-200/60',
      to: '/tasks',
    },
    {
      title: 'Bekleyen Talepler',
      value: summary.openRequests,
      icon: Flame,
      color: 'from-rose-500 to-orange-600',
      bg: 'bg-rose-50 text-rose-700 border-rose-200/60',
      to: '/requests',
    },
    {
      title: 'Acil İşler',
      value: summary.urgentTasks,
      icon: AlertTriangle,
      color: 'from-amber-500 to-rose-600',
      bg: 'bg-amber-50 text-amber-800 border-amber-200/60',
      to: '/tasks?priority=Urgent',
    },
    {
      title: 'Tamamlanan İşler',
      value: summary.completedTasks,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-green-600',
      bg: 'bg-teal-50 text-teal-800 border-teal-200/60',
      to: '/tasks?status=Completed',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Ana Sayfa</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Müşteri durumu, acil görevler ve son aktiviteler
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Building2 className="w-4 h-4 text-emerald-600" />}
            onClick={() => navigate('/companies')}
          >
            Müşteriler
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/tasks')}
          >
            Yeni İş Aç
          </Button>
        </div>
      </div>

      {/* Summary Stat Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.to}
              className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg border ${card.bg} shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Urgent Tasks + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Urgent Tasks & Customer Requests */}
        <div className="lg:col-span-2 space-y-6">
          {/* 🔥 Urgent & Pending Tasks */}
          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2 text-slate-900">
                  <Flame className="w-4 h-4 text-rose-600" />
                  <span>Acil & Bekleyen İşler</span>
                </div>
              }
              subtitle="Geliştirme bekleyen yüksek öncelikli görevler"
              action={
                <Link
                  to="/tasks"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />

            {urgentAndPendingTasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Açık acil iş bulunmamaktadır.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5 -mb-5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-y border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-5">Müşteri</th>
                      <th className="py-2.5 px-3">İş Başlığı</th>
                      <th className="py-2.5 px-3">Öncelik</th>
                      <th className="py-2.5 px-3">Durum</th>
                      <th className="py-2.5 px-3">Sorumlu</th>
                      <th className="py-2.5 px-5 text-right">Hedef Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {urgentAndPendingTasks.map((task) => (
                      <tr
                        key={task.id}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className="hover:bg-slate-50/90 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-5 font-semibold text-slate-900 group-hover:text-brand-600">
                          {task.company?.companyName || '-'}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700 max-w-[200px] truncate">
                          {task.title}
                        </td>
                        <td className="py-3 px-3">
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={task.status} />
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                          {task.assignedUser?.name || 'Atanmamış'}
                        </td>
                        <td className="py-3 px-5 text-right text-slate-500 whitespace-nowrap font-medium">
                          {formatDate(task.dueDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* 💬 Recent Customer Requests */}
          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2 text-slate-900">
                  <Clock className="w-4 h-4 text-brand-600" />
                  <span>Son Müşteri Talepleri</span>
                </div>
              }
              subtitle="Müşterilerden gelen en son talepler ve durumları"
              action={
                <Link
                  to="/requests"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />

            {recentRequests.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Kayıtlı talep bulunmuyor.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5 -mb-5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-y border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-5">Müşteri</th>
                      <th className="py-2.5 px-3">Talep Başlığı</th>
                      <th className="py-2.5 px-3">Öncelik</th>
                      <th className="py-2.5 px-3">Durum</th>
                      <th className="py-2.5 px-5 text-right">Kayıt Tarihi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentRequests.map((req) => (
                      <tr
                        key={req.id}
                        onClick={() => navigate(`/requests/${req.id}`)}
                        className="hover:bg-slate-50/90 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-5 font-semibold text-slate-900 group-hover:text-brand-600">
                          {req.company?.companyName || '-'}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700 max-w-[220px] truncate">
                          {req.title}
                        </td>
                        <td className="py-3 px-3">
                          <PriorityBadge priority={req.priority} />
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="py-3 px-5 text-right text-slate-500 whitespace-nowrap font-medium">
                          {formatDate(req.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Recent Activities */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Son Aktiviteler"
              subtitle="Sistemde gerçekleşen son işlemler"
              action={
                <Link
                  to="/activities"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  Tümü <ArrowRight className="w-3 h-3" />
                </Link>
              }
            />
            <ActivityTimeline activities={recentActivities} />
          </Card>
        </div>
      </div>
    </div>
  );
};
