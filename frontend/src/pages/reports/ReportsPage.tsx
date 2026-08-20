import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Building2,
  CheckSquare,
  Flame,
  PieChart as PieIcon,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { reportService } from '../../services/report.service.js';
import { Card, CardHeader } from '../../components/common/Card.js';
import { LoadingState } from '../../components/common/LoadingState.js';

const COLORS = ['#0e8ceb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#ef4444'];
const PRIORITY_COLORS: Record<string, string> = {
  Urgent: '#ef4444',
  Acil: '#ef4444',
  High: '#f97316',
  Yüksek: '#f97316',
  Medium: '#3b82f6',
  Orta: '#3b82f6',
  Low: '#94a3b8',
  Düşük: '#94a3b8',
};

export const ReportsPage: React.FC = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analyticsReports'],
    queryFn: async () => {
      const res = await reportService.getAnalytics();
      return res.data;
    },
  });

  if (isLoading) {
    return <LoadingState message="Rapor ve analiz grafikleri hazırlanıyor..." />;
  }

  if (isError || !data) {
    return (
      <div className="p-8 text-center text-xs text-rose-500 bg-white rounded-xl border border-slate-200">
        Rapor verileri hesaplanırken bir hata oluştu.
      </div>
    );
  }

  const {
    totalCompanies,
    activeCompanies,
    totalTasks,
    openTasks,
    completedTasks,
    totalRequests,
    openRequests,
    charts,
  } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Raporlar & CRM Analitiği</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Gerçek veritabanı kayıtlarına dayalı istatistikler ve görsel dağılım grafikleri
        </p>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50/50 to-white">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Toplam Müşteri</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCompanies}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {activeCompanies} Aktif Müşteri
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50/50 to-white">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Toplam İş</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalTasks}</div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">
            {openTasks} Açık / Devam Eden
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50/50 to-white">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Tamamlanan İşler</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{completedTasks}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            %{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0} Başarı Oranı
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-rose-50/50 to-white">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Müşteri Talepleri</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{totalRequests}</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">
            {openRequests} Bekleyen Talep
          </div>
        </Card>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Tasks by Status */}
        <Card className="p-5">
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-600" />
                <span>İşlerin Durum Dağılımı</span>
              </div>
            }
            subtitle="Görevlerin aşamalarına göre adetleri"
          />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.tasksByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="#0e8ceb" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Tasks by Priority */}
        <Card className="p-5">
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-amber-600" />
                <span>İş Öncelik Dağılımı</span>
              </div>
            }
            subtitle="Acil, yüksek ve normal iş yoğunluğu"
          />
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.tasksByPriority}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {charts.tasksByPriority.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PRIORITY_COLORS[entry.name] || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-700 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 3: Requests by Status */}
        <Card className="p-5">
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-600" />
                <span>Müşteri Talepleri Durumları</span>
              </div>
            }
            subtitle="Gelen müşteri isteklerinin çözüm durumları"
          />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.requestsByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 4: Companies by Status */}
        <Card className="p-5">
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Müşteri Portföy Dağılımı</span>
              </div>
            }
            subtitle="Aday, analiz, aktif ve tamamlanan müşteriler"
          />
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.companiesByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {charts.companiesByStatus.map((entry, index) => (
                    <Cell key={`comp-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-700 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
