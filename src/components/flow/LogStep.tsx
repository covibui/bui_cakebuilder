'use client';

import { useState } from 'react';
import type { Bundle } from '@/lib/repo';
import { saveBakeLog } from '@/lib/repo';
import { newId } from '@/lib/db';
import type { BakeLog, Verdict } from '@/lib/types';
import { Button, Card, Chip, Field, H1, H2, Input, TextArea } from '@/components/ui';
import type { StepProps } from './ProjectFlow';

export default function LogStep({ bundle, go, onSaved }: { bundle: Bundle; onSaved: (s: string[]) => void } & StepProps) {
  const p = bundle.project;
  const included = bundle.components.filter((c) => c.included);
  const [bakedOn, setBakedOn] = useState(p.request.date || new Date().toISOString().slice(0, 10));
  const [verdicts, setVerdicts] = useState<Record<string, { verdict: Verdict; text: string }>>({});
  const [measured, setMeasured] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');

  // Assumptions in this cake's recipes: what did the bake actually show?
  const assumptions = included.flatMap((c) =>
    c.recipeId
      ? [...bundle.citations.values()].filter((x) => x.recipeId === c.recipeId && x.kind === 'assumption').map((x) => ({ comp: c.name, cite: x }))
      : [],
  );

  const save = async () => {
    const log: BakeLog = {
      id: newId(), projectId: p.id, bakedOn, notes,
      results: Object.entries(verdicts).map(([componentId, v]) => ({ componentId, verdict: v.verdict, changeText: v.text })),
      measured: Object.entries(measured).map(([key, value]) => {
        const [recipeId, citationId] = key.split('|');
        return { recipeId, citationId, value };
      }),
    };
    onSaved(await saveBakeLog(log));
    go('done');
  };

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <H1>How did it go?</H1>
      <Field label="Baked on"><Input type="date" value={bakedOn} onChange={(e) => setBakedOn(e.target.value)} className="w-48" /></Field>

      <div className="flex flex-col gap-3">
        <H2>Each part</H2>
        {included.map((c) => {
          const v = verdicts[c.id];
          const setV = (verdict: Verdict) => setVerdicts({ ...verdicts, [c.id]: { verdict, text: v?.text ?? '' } });
          return (
            <Card key={c.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b>{c.name}</b>
                <div className="flex gap-2">
                  <Chip on={v?.verdict === 'worked'} onClick={() => setV('worked')}>Worked</Chip>
                  <Chip on={v?.verdict === 'change'} onClick={() => setV('change')}>Change it</Chip>
                </div>
              </div>
              {v?.verdict === 'change' && (
                <Input aria-label={`What to change in ${c.name}`} placeholder="What would you do differently?" value={v.text} onChange={(e) => setVerdicts({ ...verdicts, [c.id]: { ...v, text: e.target.value } })} />
              )}
            </Card>
          );
        })}
      </div>

      {assumptions.length > 0 && (
        <div className="flex flex-col gap-3">
          <H2>Check the guesses</H2>
          <p className="text-neutral-600">Fill in what you actually saw. It replaces the guess next time.</p>
          {assumptions.map(({ comp, cite }) => {
            const key = `${cite.recipeId}|${cite.id}`;
            return (
              <Field key={key} label={`${comp}: ${cite.title}`} hint={cite.detail}>
                <Input value={measured[key] ?? ''} onChange={(e) => setMeasured({ ...measured, [key]: e.target.value })} placeholder="e.g. set in 6 hours" />
              </Field>
            );
          })}
        </div>
      )}

      <Field label="Notes"><TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <div><Button primary onClick={save}>{Object.keys(verdicts).length || Object.keys(measured).length ? 'Save to the recipe' : 'Nothing to change? Just save'}</Button></div>
    </section>
  );
}
