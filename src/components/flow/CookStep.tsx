'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Bundle } from '@/lib/repo';
import { saveProject } from '@/lib/repo';
import { bakeTimeline, planComponents } from '@/lib/plan';
import { displayAmount } from '@/lib/units';
import type { Step as RecipeStep } from '@/lib/types';
import { Button, Card, Chip, H1, H2, Note } from '@/components/ui';
import { sectionForm } from '@/lib/styles';
import { CitationProvider, CitedText, CrossSection, UnitToggle, useUnitPref } from '@/components/recipe';
import type { StepProps } from './ProjectFlow';

interface CookItem {
  day: string;
  componentId: string | null;
  component: string;
  recipeId: string;
  step: RecipeStep;
}

const fmt = (sec: number) => {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return (h ? `${h}:${String(m).padStart(2, '0')}` : String(m)) + ':' + String(s).padStart(2, '0');
};

/** Keep the screen on while baking, where the browser allows it. */
function useWakeLock() {
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    const get = () => nav.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {});
    get();
    const onVis = () => document.visibilityState === 'visible' && get();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      lock?.release().catch(() => {});
    };
  }, []);
}

function useTimer() {
  const [timer, setTimer] = useState<{ label: string; end: number; now: number } | null>(null);
  useEffect(() => {
    if (!timer) return;
    const iv = setInterval(() => setTimer((t) => (t ? { ...t, now: Date.now() } : t)), 1000);
    return () => clearInterval(iv);
  }, [timer?.end]); // eslint-disable-line react-hooks/exhaustive-deps
  const left = timer ? Math.max(0, Math.round((timer.end - timer.now) / 1000)) : 0;
  return {
    timer,
    left,
    start: (label: string, seconds: number) => {
      const now = Date.now();
      setTimer({ label, end: now + seconds * 1000, now });
    },
    stop: () => setTimer(null),
  };
}

export default function CookStep({ bundle, go }: { bundle: Bundle } & StepProps) {
  const p = bundle.project;
  useWakeLock();
  const [view, setView] = useState<'card' | 'walk'>('card');
  const [i, setI] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [pref, setPref] = useUnitPref();
  const t = useTimer();
  const plans = planComponents(p, bundle.components, bundle.recipes);
  const days = bakeTimeline(p, bundle.components);

  useEffect(() => {
    if (p.status === 'planning') saveProject({ ...p, status: 'baking' });
  }, [p]);

  // Walkthrough order: by day, then component, then step; assembly last.
  const items = useMemo<CookItem[]>(() => {
    const out: CookItem[] = [];
    for (const d of days) {
      for (const task of d.tasks) {
        const plan = plans.find((x) => x.component.id === task.componentId);
        if (plan) plan.recipe.steps.forEach((step) => out.push({ day: d.label, componentId: plan.component.id, component: plan.component.name, recipeId: plan.recipe.id, step }));
        else if (!task.componentId) out.push({ day: d.label, componentId: null, component: d.offset === 0 ? 'Finish' : 'Timing', recipeId: '', step: { text: task.text } });
      }
    }
    return out;
  }, [days, plans]);

  const cur = items[Math.min(i, items.length - 1)];
  const last = i >= items.length - 1;

  return (
    <CitationProvider>
      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <H1>Bake: {p.title}</H1>
          <div className="flex flex-wrap gap-2">
            <Chip on={view === 'card'} onClick={() => setView('card')}>Recipe card</Chip>
            <Chip on={view === 'walk'} onClick={() => setView('walk')}>Walkthrough</Chip>
            <UnitToggle pref={pref} setPref={setPref} />
          </div>
        </div>

        {bundle.components.some((c) => c.included && !c.recipeId) && (
          <Note tone="warn">
            No recipe yet for {bundle.components.filter((c) => c.included && !c.recipeId).map((c) => c.name).join(', ')}. They’re left out of these steps.
          </Note>
        )}

        {t.timer && (
          <div role="timer" className="flex items-center justify-between rounded-xl border-2 border-neutral-800 bg-neutral-100 p-3">
            <span className="font-semibold">{t.timer.label}{t.left === 0 ? ' · done' : ''}</span>
            <span className="text-2xl font-bold tabular-nums">{fmt(t.left)}</span>
            <Button onClick={t.stop}>Stop</Button>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[minmax(0,14rem)_1fr]">
          <CrossSection components={bundle.components} size={p.size} form={sectionForm(p)} highlight={view === 'walk' ? cur.componentId ?? undefined : open ?? undefined} scale={1.1} />

          {view === 'card' ? (
            <div className="flex flex-col gap-3">
              {days.map((d) => (
                <div key={d.offset} className="flex flex-col gap-2">
                  <H2>{d.label}</H2>
                  {plans.filter((x) => x.component.makeAheadDay === d.offset).map((x) => (
                    <Card key={x.component.id}>
                      <button type="button" className="flex w-full justify-between text-left font-semibold" aria-expanded={open === x.component.id} onClick={() => setOpen(open === x.component.id ? null : x.component.id)}>
                        {x.component.name} <span aria-hidden>{open === x.component.id ? '−' : '+'}</span>
                      </button>
                      {open === x.component.id && (
                        <div className="mt-2 flex flex-col gap-2">
                          <ul>{x.ingredients.map((ing) => <li key={ing.name}>{displayAmount(ing, ing.scaled, pref)} {ing.name}</li>)}</ul>
                          <ol className="list-decimal pl-5">
                            {x.recipe.steps.map((s, k) => (
                              <li key={k} className="py-1">
                                <CitedText text={s.text} recipeId={x.recipe.id} citations={bundle.citations} />
                                {s.timer && <Button className="ml-2 min-h-9 py-1 text-sm" onClick={() => t.start(s.timer!.label, s.timer!.seconds)}>Start {fmt(s.timer.seconds)}</Button>}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ))}
              <div><Button primary onClick={() => go('log')}>Done baking: log it</Button></div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-neutral-600">Step {i + 1} of {items.length} · {cur.day} · {cur.component}</p>
              <ol className="flex flex-col gap-2">
                {items.map((x, k) =>
                  Math.abs(k - i) <= 2 ? (
                    <li key={k}>
                      <button type="button" onClick={() => setI(k)} className={`text-left ${k === i ? 'border-l-4 border-neutral-800 pl-3 text-2xl font-bold' : 'pl-4 text-neutral-500'}`} aria-current={k === i ? 'step' : undefined}>
                        {x.recipeId ? <CitedText text={x.step.text} recipeId={x.recipeId} citations={bundle.citations} /> : x.step.text}
                      </button>
                    </li>
                  ) : null,
                )}
              </ol>
              {cur.step.timer && <div><Button onClick={() => t.start(cur.step.timer!.label, cur.step.timer!.seconds)}>Start timer · {fmt(cur.step.timer.seconds)}</Button></div>}
              <div className="flex gap-2">
                <Button onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>← Back</Button>
                <Button primary onClick={() => (last ? go('log') : setI(i + 1))}>{last ? 'Finish and log it' : 'Next step →'}</Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </CitationProvider>
  );
}
