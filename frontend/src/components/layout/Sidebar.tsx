import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CheckSquare,
  Flame,
  Activity as ActivityIcon,
  BarChart3,
  Settings,
  LogOut,
  Layers,
  Shield,
  Code,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { getInitials } from '../../utils/formatters.js';
import { cn } from '../../utils/cn.js';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout, isAdmin, isDeveloper } = useAuth();

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Müşteriler', to: '/companies', icon: Building2 },
    { label: 'İşler & Geliştirme', to: '/tasks', icon: CheckSquare },
    { label: 'Talepler', to: '/requests', icon: Flame },
    { label: 'Aktiviteler', to: '/activities', icon: ActivityIcon },
    { label: 'Raporlar', to: '/reports', icon: BarChart3 },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Ayarlar', to: '/settings', icon: Settings });
  }

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Shield className="w-2.5 h-2.5" /> Admin
          </span>
        );
      case 'DEVELOPER':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Code className="w-2.5 h-2.5" /> Geliştirici
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <UserCheck className="w-2.5 h-2.5" /> Satış / CRM
          </span>
        );
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide uppercase">SMARTBASE CRM</h1>
          <p className="text-[10px] text-slate-400 font-medium">İş & Müşteri Yönetimi</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Ana Menü
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* User Card & Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {getInitials(user?.name || '')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">{user?.name || 'Kullanıcı'}</div>
            <div className="mt-0.5">{getRoleBadge(user?.role)}</div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
};
