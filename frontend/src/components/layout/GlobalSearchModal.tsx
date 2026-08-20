import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, FolderPlus, Flame, Loader2, X, ArrowRight } from 'lucide-react';
import { searchService, SearchResults } from '../../services/search.service.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { PriorityBadge } from '../common/PriorityBadge.js';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await searchService.search(query.trim());
        setResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  if (!isOpen) return null;

  const hasAnyResults =
    results &&
    (results.companies.length > 0 || results.tasks.length > 0 || results.requests.length > 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24 text-center">
        <div
          className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-2xl border border-slate-100 animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Box */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Müşteri adı, iş başlığı, talep veya yetkili ara... (örn: Nova)"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-900"
            />
            {isLoading && <Loader2 className="w-4 h-4 text-brand-600 animate-spin shrink-0" />}
            {query && !isLoading && (
              <button
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
              ESC
            </kbd>
          </div>

          {/* Results Area */}
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {query.length < 2 && (
              <div className="text-center py-8 text-xs text-slate-400">
                Aramak istediğiniz şirket adı, iş başlığı veya talep kelimesini girin.
              </div>
            )}

            {query.length >= 2 && !isLoading && !hasAnyResults && (
              <div className="text-center py-8 text-xs text-slate-500">
                "<span className="font-semibold text-slate-700">{query}</span>" ile eşleşen sonuç
                bulunamadı.
              </div>
            )}

            {/* Companies Results */}
            {results && results.companies.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  Müşteriler ({results.companies.length})
                </div>
                <div className="space-y-1">
                  {results.companies.map((comp) => (
                    <button
                      key={comp.id}
                      onClick={() => handleSelect(`/companies/${comp.id}`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all text-left group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-brand-600 truncate">
                          {comp.companyName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {comp.industry || 'Sektör belirtilmemiş'} • {comp.phone || 'Telefon yok'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={comp.status} />
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks Results */}
            {results && results.tasks.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                  <FolderPlus className="w-3.5 h-3.5 text-indigo-600" />
                  İşler & Geliştirmeler ({results.tasks.length})
                </div>
                <div className="space-y-1">
                  {results.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleSelect(`/tasks/${task.id}`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all text-left group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-brand-600 truncate">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {task.company?.companyName} •{' '}
                          {task.assignedUser ? task.assignedUser.name : 'Atanmamış'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Requests Results */}
            {results && results.requests.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                  Müşteri Talepleri ({results.requests.length})
                </div>
                <div className="space-y-1">
                  {results.requests.map((req) => (
                    <button
                      key={req.id}
                      onClick={() => handleSelect(`/requests/${req.id}`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all text-left group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-brand-600 truncate">
                          {req.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {req.company?.companyName} • {req.requestedBy || 'Talep Eden Belirtilmedi'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <PriorityBadge priority={req.priority} />
                        <StatusBadge status={req.status} />
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
