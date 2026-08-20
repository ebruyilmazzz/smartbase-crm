import React from 'react';
import { Badge } from './Badge.js';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (
    val: string
  ): { label: string; variant: 'gray' | 'blue' | 'green' | 'amber' | 'rose' | 'purple' | 'indigo' } => {
    switch (val) {
      // Company Statuses
      case 'Lead':
      case 'Aday':
        return { label: 'Aday Müşteri', variant: 'indigo' };
      case 'Analysis':
      case 'Analiz':
        return { label: 'Analiz', variant: 'amber' };
      case 'Active':
      case 'Aktif':
        return { label: 'Aktif', variant: 'green' };
      case 'Passive':
      case 'Pasif':
        return { label: 'Pasif', variant: 'gray' };
      case 'Completed':
      case 'Tamamlandı':
        return { label: 'Tamamlandı', variant: 'green' };

      // Task Statuses
      case 'Pending':
      case 'Beklemede':
        return { label: 'Beklemede', variant: 'gray' };
      case 'Planned':
      case 'Planlandı':
        return { label: 'Planlandı', variant: 'purple' };
      case 'Development':
      case 'Geliştirmede':
        return { label: 'Geliştirmede', variant: 'blue' };
      case 'Testing':
      case 'Testte':
        return { label: 'Test Aşamasında', variant: 'purple' };
      case 'Customer Approval':
      case 'Müşteri Onayı':
        return { label: 'Müşteri Onayında', variant: 'amber' };
      case 'Cancelled':
      case 'İptal':
        return { label: 'İptal Edildi', variant: 'rose' };

      // Request Statuses
      case 'New':
      case 'Yeni':
        return { label: 'Yeni Talep', variant: 'indigo' };
      case 'Waiting for Customer':
      case 'Müşteri Bekleniyor':
        return { label: 'Müşteri Yanıtı Bekleniyor', variant: 'amber' };

      default:
        return { label: val || 'Bilinmiyor', variant: 'gray' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className={className}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {config.label}
    </Badge>
  );
};
