'use client';

// Café Scrapbook primitives (design system: https://claude.ai/artifact/3mfWy4s8mCLUzrDAmgiJLJ).
// Paper first, color second: ribbon for the one primary action, rose and pistachio for selection.
import Link from 'next/link';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

const BTN = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-pill px-5 font-body text-[15px] font-extrabold transition disabled:cursor-not-allowed disabled:opacity-45';
const TAPE = 'bg-latte text-espresso [background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.4)_0_5px,transparent_5px_10px)] hover:brightness-[.97]';

/** Primary (ribbon) once per view; the default is the tape button; `quiet` is the script-style text link. */
export function Button({ primary, quiet, small, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean; quiet?: boolean; small?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        BTN,
        small && 'min-h-9 px-4 text-[13px]',
        primary ? 'bg-ribbon text-white hover:bg-ribbon-dark' : quiet ? 'bg-transparent px-2 font-display font-medium text-espresso underline underline-offset-4' : TAPE,
        className,
      )}
    />
  );
}

export function ButtonLink({ href, primary, small, className, children }: { href: string; primary?: boolean; small?: boolean; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={cx(BTN, small && 'min-h-9 px-4 text-[13px]', primary ? 'bg-ribbon text-white hover:bg-ribbon-dark' : TAPE, className)}>
      {children}
    </Link>
  );
}

/** Sticker chip: white sticker edge, pistachio when picked. An optional cake-color dot names a flavor. */
export function Chip({ on, dot, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean; dot?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      {...props}
      className={cx(
        'inline-flex min-h-10 items-center gap-2 rounded-pill border-[3px] border-white px-4 text-sm font-bold text-espresso shadow-sticker transition',
        on ? 'bg-pistachio' : 'bg-milk hover:bg-paper',
        className,
      )}
    >
      {dot && <span aria-hidden className="h-3 w-3 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(74,52,44,.2)]" style={{ background: dot }} />}
      {children}
    </button>
  );
}

/** Pick one of a few options. Selected: solid rose with a ribbon border (no pattern under text). */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T | undefined; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cx(
            'min-h-10 rounded-md border-[1.5px] px-4 text-[13px] font-extrabold text-espresso',
            value === v ? 'border-ribbon bg-rose' : 'border-dashed border-latte bg-milk hover:bg-paper',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="font-accent text-[11px] font-medium uppercase tracking-[.12em] text-espresso-muted">{children}</span>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      {hint && <span className="text-sm text-espresso-muted">{hint}</span>}
      {children}
    </label>
  );
}

const FIELD = 'min-h-11 rounded-md border-[1.5px] border-border-control bg-paper px-3 text-[15px] text-espresso placeholder:text-espresso-muted/70';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(FIELD, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(FIELD, 'py-2', props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(FIELD, 'px-2', props.className)} />;
}

type Tape = 'gingham' | 'rose' | 'latte' | 'pistachio' | 'chevron' | 'argyle';
const TAPES: Record<Tape, string> = {
  gingham: '[background:repeating-linear-gradient(90deg,rgba(169,80,95,.2)_0_6px,transparent_6px_12px),repeating-linear-gradient(0deg,rgba(169,80,95,.2)_0_6px,transparent_6px_12px),var(--rose-light)]',
  rose: '[background:repeating-linear-gradient(45deg,rgba(255,255,255,.4)_0_5px,transparent_5px_10px),var(--rose)]',
  latte: '[background:repeating-linear-gradient(90deg,rgba(255,255,255,.4)_0_5px,transparent_5px_10px),var(--latte)]',
  pistachio: '[background:repeating-linear-gradient(90deg,rgba(255,255,255,.4)_0_5px,transparent_5px_10px),var(--pistachio)]',
  chevron: '[background:linear-gradient(135deg,var(--rose)_25%,transparent_25%)_-6px_0/12px_12px,linear-gradient(225deg,var(--rose)_25%,transparent_25%)_-6px_0/12px_12px,linear-gradient(315deg,var(--rose)_25%,transparent_25%)_0_0/12px_12px,linear-gradient(45deg,var(--rose)_25%,transparent_25%)_0_0/12px_12px,var(--rose-light)]',
  argyle: '[background:linear-gradient(45deg,var(--pistachio)_25%,transparent_25%,transparent_75%,var(--pistachio)_75%)_0_0/20px_28px,linear-gradient(-45deg,var(--pistachio)_25%,transparent_25%,transparent_75%,var(--pistachio)_75%)_0_0/20px_28px,var(--latte-light)]',
};

/** Washi tape: decoration only. Never carries text, never covers a control. */
export function Washi({ tape = 'pistachio', className }: { tape?: Tape; className?: string }) {
  return <span aria-hidden className={cx('pointer-events-none absolute block h-[22px] w-24 -rotate-3', TAPES[tape], className)} />;
}

/** Label-maker strip used as a section title. One per card. */
export function LabelTape({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-block -rotate-1 rounded-xs bg-espresso px-2.5 py-1 font-accent text-xs font-medium uppercase leading-4 tracking-[.12em] text-milk shadow-[inset_0_-2px_0_rgba(0,0,0,.25)]', className)}>
      {children}
    </span>
  );
}

/** Paper card. Optional tape on top and a label-tape title. */
export function Card({ children, className, tape, label, selected }: { children: ReactNode; className?: string; tape?: Tape; label?: string; selected?: boolean }) {
  return (
    <div className={cx('relative rounded-sm bg-paper p-5 shadow-paper', tape && 'pt-6', selected && 'outline-2 outline-offset-2 outline-ribbon', className)}>
      {tape && <Washi tape={tape} className="-top-[11px] left-1/2 -ml-12" />}
      {label && <div className="mb-3"><LabelTape>{label}</LabelTape></div>}
      {children}
    </div>
  );
}

/** Tips and warnings that are not errors: butter note. */
export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  return (
    <p className={cx('flex gap-2 rounded-md px-3 py-2 text-sm text-espresso', tone === 'warn' ? 'bg-butter' : 'bg-paper-warm')}>
      <span aria-hidden className="font-accent text-[11px] font-medium uppercase leading-5 tracking-[.12em]">{tone === 'warn' ? 'Heads up' : 'Tip'}</span>
      <span>{children}</span>
    </p>
  );
}

export function Tag({ children, tone = 'pistachio' }: { children: ReactNode; tone?: 'pistachio' | 'rose' | 'butter' | 'soft' }) {
  if (tone === 'soft') return <span className="font-display text-xs text-ribbon">{children}</span>;
  return (
    <span className={cx('inline-flex items-center rounded-xs px-1.5 py-0.5 font-accent text-[11px] font-medium uppercase tracking-[.08em] text-espresso', tone === 'rose' ? 'bg-rose' : tone === 'butter' ? 'bg-butter' : 'bg-pistachio')}>
      {children}
    </span>
  );
}

/** Kit "Medium Title" (Poppins Bold 30). */
export function H1({ children, className }: { children: ReactNode; className?: string }) {
  return <h1 className={cx('font-display text-[30px] font-bold leading-[37px] tracking-[-.22px] text-espresso', className)}>{children}</h1>;
}

/** Kit "Small Title" (Poppins Bold 20). */
export function H2({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cx('font-display text-xl font-bold leading-[30px] tracking-[-.22px] text-espresso', className)}>{children}</h2>;
}

/** Round 8 fix: every step ends with where you are and one clear next action. */
export function NextRow({ hint, children }: { hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t-[1.5px] border-dashed border-latte pt-4">
      <p className="font-accent text-sm font-medium text-espresso-muted">{hint}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/** Top bar on every screen: logo, the cake's name and save state, then actions. */
export function AppBar({ title, saved, children }: { title?: string; saved?: boolean; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-paper/95 shadow-paper backdrop-blur">
      <div aria-hidden className="h-[6px] w-full [background:radial-gradient(circle_at_10px_0,var(--rose)_6px,transparent_6.5px)_0_0/20px_6px]" />
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-5 py-3">
        <Link href="/" className="shrink-0 font-display text-xl font-bold text-ribbon">Cake Builder</Link>
        {title && <span className="min-w-0 flex-1 truncate font-display text-base font-semibold text-espresso">{title}</span>}
        {title && saved && <span className="hidden text-xs text-espresso-muted sm:inline">Saved on this device</span>}
        {!title && <span className="flex-1" />}
        {children}
      </div>
    </header>
  );
}

/** Folder tabs for the wizard. Done = pistachio, current = taller rose tab. */
export function StepTabs<T extends string>({ steps, current, onGo }: { steps: [T, string][]; current: number; onGo: (s: T) => void }) {
  return (
    <nav aria-label="Steps" className="-mx-5 overflow-x-auto px-5">
      <ol className="flex min-w-max items-end gap-1.5 border-b-[3px] border-rose">
        {steps.map(([s, label], i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => onGo(s)}
              aria-current={i === current ? 'step' : undefined}
              className={cx(
                'flex items-center gap-2 rounded-t-md pl-2 pr-4 text-sm font-extrabold text-espresso',
                i === current ? 'h-12 bg-rose' : i < current ? 'h-10 bg-pistachio' : 'h-10 bg-latte-light',
              )}
            >
              <span className={cx('inline-flex h-6 w-6 items-center justify-center rounded-full text-xs', i === current ? 'bg-ribbon text-white' : 'bg-paper')}>
                {i < current ? '✓' : i + 1}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cx('mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6', className)}>{children}</main>;
}
