import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export const LoadingState: React.FC<{ message?: string; className?: string }> = ({
  message = 'Yükleniyor...',
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 gap-3 text-slate-400', className)}>
      <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      <p className="text-xs font-medium text-slate-500">{message}</p>
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={cn('animate-pulse bg-slate-200 rounded-md', className)} />;
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full space-y-3 p-4">
      <div className="flex gap-4 mb-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2 border-t border-slate-100">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};
