'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/lib/i18n';
import { Button, Input, Select } from '@/components/ui';
import type { Locale } from '@/lib/i18n';

const schema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'يجب أن تحتوي على حرف كبير وصغير ورقم'),
  confirmPassword: z.string(),
  locale: z.string().default('ar'),
}).refine(d => d.password === d.confirmPassword, { message: 'كلمتا المرور غير متطابقتين', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { locale: 'ar' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data.name, data.email, data.password, data.locale as Locale);
      toast.success(locale === 'ar' ? 'تم إنشاء الحساب! تحقق من بريدك الإلكتروني.' : 'Account created! Check your email.');
      router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || (locale === 'ar' ? 'فشل إنشاء الحساب' : 'Registration failed'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-islamic-dark to-islamic-navy flex items-center justify-center p-4 geometric-bg">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center shadow-2xl">
              <span className="text-white text-3xl arabic-text font-bold">ن</span>
            </div>
            <p className="text-xl font-bold text-white arabic-text">نور العلم</p>
          </Link>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-xl font-bold text-white arabic-text mb-6 text-center">{t('auth.register')}</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input {...register('name')} type="text" label={t('auth.name')} placeholder={locale === 'ar' ? 'الاسم الكامل' : 'Full name'}
              error={errors.name?.message} dark />

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

            <Input {...register('confirmPassword')} type={showPass ? 'text' : 'password'} label={t('auth.confirmPassword')}
              placeholder="••••••••" error={errors.confirmPassword?.message} dark />

            <div>
              <label className="block text-sm font-medium text-gray-300 arabic-text mb-1.5">
                {locale === 'ar' ? 'اللغة المفضلة' : locale === 'ru' ? 'Предпочитаемый язык' : 'Preferred Language'}
              </label>
              <select {...register('locale')} className="input-field-dark w-full">
                <option value="ar">العربية</option>
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>

            <Button type="submit" loading={isLoading} icon={<UserPlus className="w-4 h-4" />} className="w-full justify-center mt-2">
              <span className="arabic-text">{t('auth.register')}</span>
            </Button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6 arabic-text">
            {t('auth.hasAccount')}{' '}
            <Link href="/auth/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
