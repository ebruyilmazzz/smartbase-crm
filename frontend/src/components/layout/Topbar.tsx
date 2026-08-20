import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Building2,
  FolderPlus,
  Flame,
  Menu,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../common/Button.js';
import { GlobalSearchModal } from './GlobalSearchModal.js';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  onOpenNewCompany?: () => void;
  onOpenNewTask?: () => void;
  onOpenNewRequest?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileMenu,
  onOpenNewCompany,
  onOpenNewTask,
  onOpenNewRequest,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const { user, isAdmin, isSales } = useAuth();
  const navigate = useNavigate();

  // Keyboard shortcut Ctrl+K / Cmd+K for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Menüyü Aç"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Button Bar */}
        <div className="flex-1 max-w-lg">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-slate-100/80 hover:bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200/60 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors" />
              <span>Müşteri, iş veya talep ara...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Quick Create Dropdown for Sales and Admin */}
          {(isAdmin || isSales) && (
            <div className="relative">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                rightIcon={<ChevronDown className="w-3.5 h-3.5 opacity-70" />}
                onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
              >
                <span className="hidden sm:inline">Hızlı Ekle</span>
              </Button>

              {isQuickAddOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsQuickAddOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        setIsQuickAddOpen(false);
                        if (onOpenNewCompany) onOpenNewCompany();
                        else navigate('/companies?action=new');
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors text-left"
                    >
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      Yeni Müşteri Ekle
                    </button>
                    <button
                      onClick={() => {
                        setIsQuickAddOpen(false);
                        if (onOpenNewTask) onOpenNewTask();
                        else navigate('/tasks?action=new');
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors text-left"
                    >
                      <FolderPlus className="w-4 h-4 text-indigo-600" />
                      Yeni İş / Görev Ekle
                    </button>
                    <button
                      onClick={() => {
                        setIsQuickAddOpen(false);
                        if (onOpenNewRequest) onOpenNewRequest();
                        else navigate('/requests?action=new');
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors text-left"
                    >
                      <Flame className="w-4 h-4 text-rose-600" />
                      Yeni Müşteri Talebi
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* User Profile summary chip */}
          <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800">{user?.name}</div>
              <div className="text-[10px] text-slate-400 font-medium capitalize">
                {user?.role === 'ADMIN'
                  ? 'Yönetici'
                  : user?.role === 'DEVELOPER'
                  ? 'Yazılım Geliştirici'
                  : 'Müşteri Temsilcisi'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
