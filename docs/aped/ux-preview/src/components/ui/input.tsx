import { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-xs font-medium text-[var(--foreground)]">
          {label}
          {props.required && <span className="text-[var(--destructive)] ml-0.5" aria-hidden="true">*</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={clsx(
            'h-8 w-full rounded-[8px] border bg-transparent px-2.5 text-xs',
            'transition-colors duration-200',
            'placeholder:text-[var(--muted-foreground)]',
            'focus:outline-1 focus:outline-offset-0 focus:outline-[var(--ring)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-[var(--destructive)]' : 'border-[var(--border)]',
            className,
          )}
          {...props}
        />
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
