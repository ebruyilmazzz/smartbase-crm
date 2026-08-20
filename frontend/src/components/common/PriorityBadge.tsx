import React from 'react';
import { Flame, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from './Badge.js';

export interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className }) => {
  switch (priority) {
    case 'Urgent':
    case 'Acil':
      return (
        <Badge variant="rose" className={className}>
          <Flame className="w-3.5 h-3.5 text-rose-600" />
          <span>Acil</span>
        </Badge>
      );
    case 'High':
    case 'Yüksek':
      return (
        <Badge variant="amber" className={className}>
          <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
          <span>Yüksek</span>
        </Badge>
      );
    case 'Medium':
    case 'Orta':
      return (
        <Badge variant="blue" className={className}>
          <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>Orta</span>
        </Badge>
      );
    case 'Low':
    case 'Düşük':
    default:
      return (
        <Badge variant="gray" className={className}>
          <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
          <span>Düşük</span>
        </Badge>
      );
  }
};
