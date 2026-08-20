import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity as ActivityIcon, Filter, Building2, User, Clock } from 'lucide-react';
import { activityService } from '../../services/activity.service.js';
import { companyService } from '../../services/company.service.js';
import { settingsService } from '../../services/settings.service.js';
import { Card, CardHeader } from '../../components/common/Card.js';
import { Select } from '../../components/common/Select.js';
import { Button } from '../../components/common/Button.js';
import { ActivityTimeline } from '../../components/activity/ActivityTimeline.js';
import { Pagination } from '../../components/common/Pagination.js';
import { LoadingState } from '../../components/common/LoadingState.js';

export const ActivityList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [userFilter, setUserFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  // Fetch users for filter
  const { data: users } = useQuery({
    queryKey: ['usersDropdown'],
    queryFn: async () => {
      const res = await settingsService.getUsers();
      return res.data;
    },
  });

  // Fetch companies for filter
  const { data: companies } = useQuery({
    queryKey: ['companiesDropdown'],
    queryFn: async () => {
      const res = await companyService.getCompanies({ limit: 100 });
      return res.data;
    },
  });

  // Fetch activities
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['activities', { page, userId: userFilter, companyId: companyFilter }],
    queryFn: async () => {
      const res = await activityService.getActivities({
        page,
        limit: 25,
        userId: userFilter || undefined,
        companyId: companyFilter || undefined,
      });
      return res;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sistem Aktiviteleri</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tüm kullanıcılar ve müşteriler için oluşturulan otomatik işlem ve denetim kayıtları
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-64">
            <Select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 text-xs bg-slate-50"
            >
              <option value="">-- Tüm Kullanıcılar --</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </Select>
          </div>

          <div className="w-full sm:w-64">
            <Select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 text-xs bg-slate-50"
            >
              <option value="">-- Tüm Müşteriler --</option>
              {companies?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </Select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setUserFilter('');
              setCompanyFilter('');
              setPage(1);
            }}
          >
            Filtreleri Temizle
          </Button>
        </div>
      </Card>

      {/* Activity Timeline Card */}
      <Card>
        <CardHeader
          title="Zaman Çizelgesi"
          subtitle="Kronolojik sıralı aktivite ve aksiyon akışı"
        />

        {isLoading ? (
          <LoadingState message="Aktiviteler getiriliyor..." />
        ) : isError || !data ? (
          <div className="p-8 text-center text-xs text-rose-500">
            Aktivite kayıtları yüklenemedi.
          </div>
        ) : (
          <div className="space-y-6">
            <ActivityTimeline activities={data.data} />

            {data.meta && (
              <div className="pt-4 border-t border-slate-100">
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
    </div>
  );
};
