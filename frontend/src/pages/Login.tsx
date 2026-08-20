import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, Mail, Lock, Shield, UserCheck, Code } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';

const loginSchema = z.object({
  email: z.string().min(1, 'E-posta adresi zorunludur.').email('Geçerli bir e-posta adresi giriniz.'),
  password: z.string().min(1, 'Şifre zorunludur.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@smartbase.com',
      password: 'Admin123!',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data);
      toastSuccess('Giriş başarılı. SmartBase CRM paneline hoş geldiniz.');
      navigate(from, { replace: true });
    } catch (err: any) {
      toastError(err.message || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-brand-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-brand-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-xl shadow-brand-500/25 mb-4 ring-8 ring-slate-900">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">SMARTBASE CRM</h1>
          <p className="text-sm text-slate-400 mt-1">Müşteri ve İş Yönetim Sistemi Girişi</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-7 border border-slate-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="E-posta Adresi"
              type="email"
              placeholder="ornek@smartbase.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Şifre"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 font-semibold shadow-md"
              isLoading={isLoading}
            >
              Giriş Yap
            </Button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              Hızlı Test Hesapları
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@smartbase.com', 'Admin123!')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all text-slate-700 hover:text-brand-700 text-xs font-semibold group"
              >
                <Shield className="w-4 h-4 text-rose-500 mb-1 group-hover:scale-110 transition-transform" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sales@smartbase.com', 'Sales123!')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all text-slate-700 hover:text-brand-700 text-xs font-semibold group"
              >
                <UserCheck className="w-4 h-4 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                <span>Satış</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('dev@smartbase.com', 'Dev123!')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all text-slate-700 hover:text-brand-700 text-xs font-semibold group"
              >
                <Code className="w-4 h-4 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                <span>Geliştirici</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 SmartBase CRM. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
};
