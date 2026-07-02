'use client';

/** Primitivas de UI mínimas (Tailwind) para o painel admin claro. */
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', className, ...props },
  ref,
) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-base font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C9A24C]';
  const variants = {
    primary: 'bg-[#C9A24C] text-[#071A33] hover:bg-[#D8B25A]',
    secondary: 'border border-slate-300 bg-white text-[#071A33] hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-[#6E7683] hover:bg-slate-100 hover:text-[#071A33]',
  } as const;
  return <button ref={ref} className={cx(base, variants[variant], className)} {...props} />;
});

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-base font-semibold text-[#071A33]">{label}</span>
      {children}
      {hint ? <span className="text-sm text-slate-400">{hint}</span> : null}
    </label>
  );
}

const inputBase =
  'w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#C9A24C] focus:outline-none focus:ring-1 focus:ring-[#C9A24C]';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cx(inputBase, className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cx(inputBase, 'min-h-20 resize-y', className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cx(inputBase, 'appearance-none', className)} {...props}>
        {children}
      </select>
    );
  },
);

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        'h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#C9A24C]',
        className,
      )}
    />
  );
}

export function Badge({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: 'slate' | 'green' | 'amber' | 'indigo';
}) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    indigo: 'bg-[#FBF6E9] text-[#7A6320] border border-[#F0E4C4]',
  } as const;
  return (
    <span className={cx('rounded-full px-3 py-1 text-sm font-semibold', tones[tone])}>
      {children}
    </span>
  );
}
