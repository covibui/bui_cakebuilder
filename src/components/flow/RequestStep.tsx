'use client';

import { useState } from 'react';
import type { Bundle } from '@/lib/repo';
import { saveProject } from '@/lib/repo';
import type { Request } from '@/lib/types';
import { Button, Card, H1, Input, NextRow, TextArea } from '@/components/ui';
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
    <section className="grid gap-6 md:grid-cols-[minmax(0,36rem)_1fr]">
      <Card tape="gingham" label="Their request">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            commit(i + 1);
          }}
        >
          <p className="font-accent text-sm font-medium text-espresso-muted">Question {i + 1} of {QUESTIONS.length} · about them</p>
          <label htmlFor="q" className="flex flex-col gap-1">
            <H1>{q.ask}</H1>
            <span className="text-espresso-muted">{q.hint}</span>
          </label>
          {q.key === 'words' ? (
            <TextArea id="q" rows={3} value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          ) : (
            <Input id="q" type={q.type ?? 'text'} min={q.type === 'number' ? 1 : undefined} value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          )}
          <NextRow hint={i === QUESTIONS.length - 1 ? 'Next: choose how you want to build.' : undefined}>
            {i > 0 && <Button quiet onClick={() => { setI(i - 1); setValue(String(p.request[QUESTIONS[i - 1].key] ?? '')); }}>← Back</Button>}
            <Button onClick={() => commit(i + 1)}>Skip</Button>
            <Button primary type="submit">{i === QUESTIONS.length - 1 ? 'Continue' : 'Next'}</Button>
          </NextRow>
        </form>
      </Card>

      {i > 0 && (
        <aside className="flex flex-col gap-2 md:pt-4">
          <span className="font-accent text-[11px] font-medium uppercase tracking-[.12em] text-espresso-muted">So far</span>
          <ul className="flex flex-col gap-2">
            {QUESTIONS.slice(0, i).map((x, k) => (
              <li key={x.key}>
                <button type="button" className="w-full rounded-md bg-paper px-3 py-2 text-left shadow-sticker hover:bg-paper-warm" onClick={() => { setI(k); setValue(String(p.request[x.key] ?? '')); }}>
                  <span className="block text-xs text-espresso-muted">{x.ask}</span>
                  <span className="font-bold">{String(p.request[x.key] ?? '') || '—'}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </section>
  );
}
