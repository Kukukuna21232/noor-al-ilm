'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/lib/i18n';
import { Button, Input, Divider } from '@/components/ui';

const schema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور قصيرة جداً'),
  totpCode: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { login, isLoading, requires2FA } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password, data.totpCode);
      if (!requires2FA) {
        toast.success(locale === 'ar' ? 'مرحباً بك!' : locale === 'ru' ? 'Добро пожаловать!' : 'Welcome!');
        router.push('/');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || (locale === 'ar' ? 'فشل تسجيل الدخول' : 'Login failed'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-islamic-dark to-islamic-navy flex items-center justify-center p-4 geometric-bg">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center shadow-2xl">
              <span className="text-white text-3xl arabic-text font-bold">ن</span>
            </div>
            <p className="text-xl font-bold text-white arabic-text">نور العلم</p>
            <p className="text-gray-400 text-sm">Noor Al-Ilm</p>
          </Link>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-xl font-bold text-white arabic-text mb-6 text-center">{t('auth.login')}</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input {...register('email')} type="email" label={t('auth.email')} placeholder="example@email.com"
              error={errors.email?.message} dark />

            <div>
              <label className="block text-sm font-medium text-gray-300 arabic-text mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <input {...register('password')} type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  className="input-field-dark pr-10 w-full" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 left-3 flex items-center text-gray-400 hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1 arabic-text">{errors.password.message}</p>}
            </div>

            {requires2FA && (
              <div>
                <label className="block text-sm font-medium text-gray-300 arabic-text mb-1.5">{t('auth.twoFA')}</label>
                <input {...register('totpCode')} type="text" placeholder="000000" maxLength={6}
                  className="input-field-dark w-full text-center tracking-widest text-lg font-mono" />
              </div>
            )}

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-primary-400 hover:text-primary-300 text-sm arabic-text transition-colors">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <Button type="submit" loading={isLoading} icon={<LogIn className="w-4 h-4" />} className="w-full justify-center">
              <span className="arabic-text">{t('auth.login')}</span>
            </Button>
          </form>

          <Divider label={locale === 'ar' ? 'أو' : locale === 'ru' ? 'или' : 'or'} />

          {/* OAuth */}
          <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/auth/google`}
            className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors text-sm font-medium">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {locale === 'ar' ? 'الدخول بـ Google' : locale === 'ru' ? 'Войти через Google' : 'Continue with Google'}
          </a>

          <p className="text-center text-gray-400 text-sm mt-6 arabic-text">
            {t('auth.noAccount')}{' '}
            <Link href="/auth/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              {t('nav.register')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
