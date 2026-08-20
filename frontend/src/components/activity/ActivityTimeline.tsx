import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  FileEdit,
  FolderPlus,
  MessageSquare,
  UserPlus,
  Clock,
  Flame,
  FileText,
} from 'lucide-react';
import { Activity } from '../../types/index.js';
import { formatRelativeTime } from '../../utils/formatters.js';

export interface ActivityTimelineProps {
  activities: Activity[];
  emptyMessage?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  emptyMessage = 'Henüz kaydedilmiş bir aktivite bulunmuyor.',
}) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-slate-400">
        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        {emptyMessage}
      </div>
    );
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'COMPANY_CREATED':
        return <Building2 className="w-4 h-4 text-emerald-600" />;
      case 'COMPANY_UPDATED':
      case 'COMPANY_ARCHIVED':
        return <FileEdit className="w-4 h-4 text-blue-600" />;
      case 'TASK_CREATED':
        return <FolderPlus className="w-4 h-4 text-indigo-600" />;
      case 'TASK_STATUS_CHANGED':
        return <CheckCircle2 className="w-4 h-4 text-amber-600" />;
      case 'REQUEST_CREATED':
      case 'REQUEST_UPDATED':
      case 'REQUEST_STATUS_CHANGED':
        return <Flame className="w-4 h-4 text-rose-500" />;
      case 'NOTE_ADDED':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'USER_CREATED':
      case 'USER_UPDATED':
        return <UserPlus className="w-4 h-4 text-cyan-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {activities.map((act) => (
        <div key={act.id} className="relative group">
          {/* Dot / Icon container */}
          <div className="absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center group-hover:scale-110 transition-transform">
            {getActivityIcon(act.action)}
          </div>

          <div className="bg-slate-50/70 hover:bg-slate-50 p-3 rounded-lg border border-slate-100 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-800">
                {act.user?.name || 'Sistem'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                {formatRelativeTime(act.createdAt)}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{act.description}</p>

            {/* Entity links if present */}
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              {act.company && (
                <Link
                  to={`/companies/${act.company.id || act.companyId}`}
                  className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700 bg-brand-50/60 hover:bg-brand-50 px-2 py-0.5 rounded border border-brand-200/50"
                >
                  <Building2 className="w-3 h-3" />
                  {act.company.companyName}
                </Link>
              )}
              {act.task && (
                <Link
                  to={`/tasks/${act.task.id || act.taskId}`}
                  className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50/60 hover:bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/50"
                >
                  <FolderPlus className="w-3 h-3" />
                  {act.task.title}
                </Link>
              )}
              {act.request && (
                <Link
                  to={`/requests/${act.request.id || act.requestId}`}
                  className="inline-flex items-center gap-1 font-medium text-rose-600 hover:text-rose-700 bg-rose-50/60 hover:bg-rose-50 px-2 py-0.5 rounded border border-rose-200/50"
                >
                  <Flame className="w-3 h-3" />
                  {act.request.title}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
