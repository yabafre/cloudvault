import { type InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, type, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-xs font-medium text-[var(--foreground)]">
          {label}
          {props.required && <span className="text-[var(--destructive)] ml-0.5" aria-hidden="true">*</span>}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={cn(
              'h-8 w-full rounded-[8px] border bg-transparent px-2.5 text-xs',
              'transition-colors duration-200',
              'placeholder:text-[var(--muted-foreground)]',
              'focus:outline-1 focus:outline-offset-0 focus:outline-[var(--ring)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error ? 'border-[var(--destructive)]' : 'border-[var(--border)]',
              isPassword && 'pr-8',
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-[10px] text-[var(--destructive)]" role="alert">{error}</p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-[10px] text-[var(--muted-foreground)]">{hint}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
