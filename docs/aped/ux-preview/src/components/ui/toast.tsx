import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

const icons: Record<ToastVariant, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const iconStyles: Record<ToastVariant, string> = {
  success: 'text-emerald-500 bg-emerald-500/10',
  error: 'text-[var(--destructive)] bg-[var(--destructive)]/10',
  info: 'text-blue-500 bg-blue-500/10',
};

export function Toast({ open, onClose, title, description, variant = 'success', duration = 4000 }: ToastProps) {
  const Icon = icons[variant];

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, onClose, duration]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-4 right-4 bg-[var(--card)] border border-[var(--border)] rounded-[8px] shadow-lg p-3 flex items-center gap-2.5 z-50 max-w-xs"
          role="status"
          aria-live="polite"
        >
          <div className={cn('h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0', iconStyles[variant])}>
            <Icon className="h-3 w-3" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">{title}</p>
            {description && <p className="text-[10px] text-[var(--muted-foreground)]">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
