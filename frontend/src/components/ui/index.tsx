'use client';
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Button ────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'outline' | 'ghost' | 'danger' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    const variants = {
      primary:   'btn-primary',
      gold:      'btn-gold',
      outline:   'btn-outline',
      ghost:     'btn-ghost',
      danger:    'btn-danger',
      secondary: 'bg-muted text-foreground hover:bg-muted/80 rounded-xl font-medium transition-colors inline-flex items-center gap-2',
    };
    const sizes = { sm: '!px-3 !py-1.5 !text-xs', md: '', lg: '!px-8 !py-4 !text-base' };

    return (
      <button ref={ref} disabled={disabled || loading} className={cn(variants[variant], sizes[size], className)} {...props}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ── Card ──────────────────────────────────────────────────
interface CardProps { children: React.ReactNode; className?: string; hover?: boolean; onClick?: () => void; }
export function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <div onClick={onClick} className={cn('card p-6', hover && 'cursor-pointer hover:-translate-y-1', className)}>
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────
interface BadgeProps { children: React.ReactNode; variant?: 'primary' | 'gold' | 'red' | 'blue' | 'purple' | 'green' | 'gray'; className?: string; }
export function Badge({ children, variant = 'primary', className }: BadgeProps) {
  const variants = {
    primary: 'badge-primary', gold: 'badge-gold', red: 'badge-red',
    blue: 'badge-blue', purple: 'badge-purple',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };
  return <span className={cn('badge', variants[variant], className)}>{children}</span>;
}

// ── Input ─────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  dark?: boolean;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, dark, className, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">{icon}</div>}
        <input ref={ref} className={cn(dark ? 'input-field-dark' : 'input-field', icon && 'pr-10', error && 'border-red-500 focus:ring-red-500', className)} {...props} />
      </div>
      {error && <p className="text-red-500 text-xs mt-1 arabic-text">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

// ── Textarea ──────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string; }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">{label}</label>}
      <textarea ref={ref} className={cn('input-field resize-none', error && 'border-red-500', className)} {...props} />
      {error && <p className="text-red-500 text-xs mt-1 arabic-text">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

// ── Select ────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string; options: { value: string; label: string }[]; placeholder?: string; }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">{label}</label>}
      <select ref={ref} className={cn('input-field', error && 'border-red-500', className)} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-red-500 text-xs mt-1 arabic-text">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';

// ── Skeleton ──────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <Skeleton className="h-44 rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────
interface ProgressProps { value: number; max?: number; className?: string; color?: string; showLabel?: boolean; }
export function Progress({ value, max = 100, className, color = 'bg-primary-600', showLabel = false }: ProgressProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className={cn('w-full', className)}>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <p className="text-xs text-muted-foreground mt-1 text-right">{Math.round(pct)}%</p>}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────
interface AvatarProps { name: string; src?: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string; }
export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' };
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  if (src) return <img src={src} alt={name} className={cn('rounded-xl object-cover', sizes[size], className)} />;
  return (
    <div className={cn('rounded-xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center text-white font-bold shadow-md', sizes[size], className)}>
      {initials}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-border my-4" />;
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground arabic-text">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────
interface EmptyStateProps { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode; }
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">{icon}</div>
      <h3 className="font-bold text-foreground arabic-text mb-2">{title}</h3>
      {description && <p className="text-muted-foreground text-sm arabic-text max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}
