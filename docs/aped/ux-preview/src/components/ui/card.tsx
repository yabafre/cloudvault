import { useEffect, useRef } from 'react';
import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = item.getBoundingClientRect();
      item.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      item.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };
    item.addEventListener('mousemove', handleMouseMove);
    return () => item.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={itemRef}
      className={clsx(
        'relative overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--card)] p-0 transition-colors',
        'before:absolute before:inset-0 before:opacity-0 before:transition-opacity hover:before:opacity-100 before:pointer-events-none before:z-0',
        'hover-glow-effect',
        className,
      )}
      {...props}
    />
  );
}

// ... Keep the others but we might not need them if we don't use them.
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('relative z-10 flex flex-col gap-1.5 p-6 pb-3', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={clsx('relative z-10 font-semibold text-lg leading-none tracking-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={clsx('relative z-10 text-sm text-[var(--muted-foreground)]', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('relative z-10 p-6 pt-3', className)} {...props} />;
}
