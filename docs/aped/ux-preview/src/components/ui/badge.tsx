import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--primary)] text-[var(--primary-foreground)]',
  secondary: 'bg-[var(--secondary)] text-[var(--secondary-foreground)]',
  success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  destructive: 'bg-[var(--destructive)]/10 text-[var(--destructive)] border border-[var(--destructive)]/20',
  outline: 'border border-[var(--border)] text-[var(--foreground)]',
};

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
