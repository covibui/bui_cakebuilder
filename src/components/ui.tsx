'use client';

// Lo-fi primitives. Grayscale on purpose: styling waits for hi-fi.
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function Button({ primary, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'min-h-11 rounded-lg border-2 border-neutral-800 px-4 py-2 font-semibold disabled:opacity-40',
        primary ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-900',
        className,
      )}
    />
  );
}

export function Chip({ on, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      {...props}
      className={cx('min-h-11 rounded-full border-2 px-4 py-1.5', on ? 'border-neutral-800 bg-neutral-800 text-white' : 'border-neutral-400 bg-white', className)}
    />
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-semibold">{label}</span>
      {hint && <span className="text-sm text-neutral-600">{hint}</span>}
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx('min-h-11 rounded-lg border-2 border-neutral-400 px-3 py-2', props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx('rounded-lg border-2 border-neutral-400 px-3 py-2', props.className)} />;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-xl border-2 border-neutral-300 p-4', className)}>{children}</div>;
}

export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  return (
    <p className={cx('rounded-lg border-l-4 px-3 py-2 text-sm', tone === 'warn' ? 'border-neutral-800 bg-neutral-100' : 'border-neutral-400 bg-neutral-50')}>
      {children}
    </p>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return <h1 className="text-2xl font-bold">{children}</h1>;
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}
