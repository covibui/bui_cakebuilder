'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useProject } from '@/lib/repo';
import RequestStep from './RequestStep';
import ForkStep from './ForkStep';
import FlavorStep from './FlavorStep';
import ComponentsStep from './ComponentsStep';
import SizeStep from './SizeStep';
import BuildStep from './BuildStep';
import CookStep from './CookStep';
import LogStep from './LogStep';

export type Step = 'request' | 'fork' | 'flavor' | 'comp' | 'size' | 'build' | 'cook' | 'log' | 'done';

const WIZARD: [Step, string][] = [
  ['request', 'Request'],
  ['fork', 'How to build'],
  ['flavor', 'Flavors'],
  ['comp', 'Inside'],
  ['size', 'Size & servings'],
  ['build', 'Your build'],
];

export interface StepProps {
  go: (s: Step) => void;
}

export default function ProjectFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get('id');
  const step = (params.get('step') as Step) || 'request';
  const bundle = useProject(id);
  const [summary, setSummary] = useState<string[]>([]);

  const go = (s: Step) => {
    router.push(`/project?id=${id}&step=${s}`);
    window.scrollTo(0, 0);
  };

  if (bundle === undefined) return null;
  if (bundle === null) {
    return (
      <main className="p-6">
        <p>That cake isn&apos;t on this device.</p>
        <Link href="/" className="underline">Back to your cakes</Link>
      </main>
    );
  }

  const ci = WIZARD.findIndex(([s]) => s === step);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <nav className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="font-semibold underline">← Your cakes</Link>
        <span className="text-sm text-neutral-600">{bundle.project.title}</span>
      </nav>

      {ci >= 0 && (
        <ol className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Steps">
          {WIZARD.map(([s, label], i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => go(s)}
                aria-current={i === ci ? 'step' : undefined}
                className={`flex min-h-9 items-center gap-2 ${i === ci ? 'font-bold' : ''}`}
              >
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-neutral-800 text-xs ${i <= ci ? 'bg-neutral-800 text-white' : ''}`}>
                  {i + 1}
                </span>
                {label}
              </button>
            </li>
          ))}
        </ol>
      )}

      {step === 'request' && <RequestStep bundle={bundle} go={go} />}
      {step === 'fork' && <ForkStep bundle={bundle} go={go} />}
      {step === 'flavor' && <FlavorStep bundle={bundle} go={go} />}
      {step === 'comp' && <ComponentsStep bundle={bundle} go={go} />}
      {step === 'size' && <SizeStep bundle={bundle} go={go} />}
      {step === 'build' && <BuildStep bundle={bundle} go={go} />}
      {step === 'cook' && <CookStep bundle={bundle} go={go} />}
      {step === 'log' && <LogStep bundle={bundle} go={go} onSaved={setSummary} />}
      {step === 'done' && (
        <section className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Logged. Next time starts smarter.</h1>
          {summary.length ? (
            <ul className="list-disc pl-6">{summary.map((s) => <li key={s}>{s}</li>)}</ul>
          ) : (
            <p>No changes recorded this time.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="min-h-11 rounded-lg border-2 border-neutral-800 px-4 font-semibold" onClick={() => go('build')}>See the updated recipe</button>
            <Link href="/" className="flex min-h-11 items-center rounded-lg border-2 border-neutral-800 bg-neutral-800 px-4 font-semibold text-white">Back to your cakes</Link>
          </div>
        </section>
      )}
    </main>
  );
}
