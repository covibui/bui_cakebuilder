'use client';

import { useState } from 'react';
import type { Bundle } from '@/lib/repo';
import { saveProject } from '@/lib/repo';
import type { Request } from '@/lib/types';
import { Button, H1, Input, TextArea } from '@/components/ui';
import type { StepProps } from './ProjectFlow';

const QUESTIONS: { key: keyof Request; ask: string; hint: string; type?: string }[] = [
  { key: 'forWho', ask: 'Who is it for?', hint: 'For example: my friend Sam' },
  { key: 'occasion', ask: 'What’s the occasion?', hint: 'For example: 30th birthday' },
  { key: 'date', ask: 'When is it?', hint: 'The day you serve it', type: 'date' },
  { key: 'servings', ask: 'How many people?', hint: 'Servings drive the pan sizes', type: 'number' },
  { key: 'words', ask: 'What did they ask for, in their words?', hint: 'For example: something lemony and bright, not too sweet' },
];

/** One question at a time (I24). */
export default function RequestStep({ bundle, go }: { bundle: Bundle } & StepProps) {
  const p = bundle.project;
  const firstOpen = QUESTIONS.findIndex((q) => !String(p.request[q.key] ?? '').trim());
  const [i, setI] = useState(firstOpen < 0 ? QUESTIONS.length - 1 : firstOpen);
  const q = QUESTIONS[i];
  const [value, setValue] = useState(String(p.request[q.key] ?? ''));

  const commit = async (next: number) => {
    const v = q.key === 'servings' ? (value ? Number(value) : null) : value.trim();
    const request = { ...p.request, [q.key]: v };
    await saveProject({ ...p, request });
    if (next >= QUESTIONS.length) return go('fork');
    setI(next);
    setValue(String(request[QUESTIONS[next].key] ?? ''));
  };

  return (
    <section className="flex max-w-xl flex-col gap-5">
      <ul className="flex flex-col gap-1 text-neutral-600">
        {QUESTIONS.slice(0, i).map((x, k) => (
          <li key={x.key}>
            <button type="button" className="underline-offset-2 hover:underline" onClick={() => { setI(k); setValue(String(p.request[x.key] ?? '')); }}>
              {x.ask} <span className="font-semibold text-neutral-900">{String(p.request[x.key] ?? '') || '—'}</span>
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          commit(i + 1);
        }}
      >
        <label htmlFor="q" className="flex flex-col gap-1">
          <H1>{q.ask}</H1>
          <span className="text-neutral-600">{q.hint}</span>
        </label>
        {q.key === 'words' ? (
          <TextArea id="q" rows={3} value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        ) : (
          <Input id="q" type={q.type ?? 'text'} min={q.type === 'number' ? 1 : undefined} value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        )}
        <div className="flex gap-2">
          {i > 0 && <Button onClick={() => { setI(i - 1); setValue(String(p.request[QUESTIONS[i - 1].key] ?? '')); }}>Back</Button>}
          <Button primary type="submit">{i === QUESTIONS.length - 1 ? 'Continue' : 'Next'}</Button>
          <Button onClick={() => commit(i + 1)} className="border-neutral-400">Skip</Button>
        </div>
      </form>
    </section>
  );
}
