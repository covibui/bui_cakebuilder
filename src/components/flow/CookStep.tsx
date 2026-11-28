'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Bundle } from '@/lib/repo';
import { saveProject } from '@/lib/repo';
import { bakeTimeline, planComponents } from '@/lib/plan';
import { displayAmount } from '@/lib/units';
import type { Step as RecipeStep } from '@/lib/types';
import { Button, Card, H1, H2, LabelTape, NextRow, Note, Segmented } from '@/components/ui';
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
          <div className="flex flex-col gap-1">
            <span className="font-accent text-[11px] font-medium uppercase tracking-[.12em] text-espresso-muted">Cook mode · screen stays on</span>
            <H1>{p.title}</H1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented label="Cook view" value={view} onChange={setView} options={[['card', 'Recipe card'], ['walk', 'Step by step']]} />
            <UnitToggle pref={pref} setPref={setPref} />
          </div>
        </div>

        {bundle.components.some((c) => c.included && !c.recipeId) && (
          <Note tone="warn">
            No recipe yet for {bundle.components.filter((c) => c.included && !c.recipeId).map((c) => c.name).join(', ')}. They’re left out of these steps.
          </Note>
        )}

        {t.timer && (
          <div role="timer" className={`sticky top-20 z-20 flex items-center justify-between gap-3 rounded-pill px-5 py-2 shadow-paper ${t.left === 0 ? 'bg-pistachio' : 'bg-butter'}`}>
            <span className="font-bold">{t.timer.label}{t.left === 0 ? ' · done' : ''}</span>
            <span className="font-accent text-[30px] font-medium tabular-nums">{fmt(t.left)}</span>
            <Button small onClick={t.stop}>Stop</Button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
          {/* Phones: the step you're on comes first; the cake follows. */}
          <div className="order-2 lg:order-none lg:sticky lg:top-24 lg:self-start">
            <Card tape="rose" label="You are here">
              <CrossSection components={bundle.components} size={p.size} form={sectionForm(p)} highlight={view === 'walk' ? cur.componentId ?? undefined : open ?? undefined} scale={1.1} />
            </Card>
          </div>

          {view === 'card' ? (
            <div className="flex flex-col gap-5">
              {days.map((d) => (
                <div key={d.offset} className="flex flex-col gap-3">
                  <div><LabelTape>{d.label}</LabelTape></div>
                  {plans.filter((x) => x.component.makeAheadDay === d.offset).map((x) => (
                    <Card key={x.component.id}>
                      <button type="button" className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open === x.component.id} onClick={() => setOpen(open === x.component.id ? null : x.component.id)}>
                        <H2>{x.component.name}</H2>
                        <span aria-hidden className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-light text-lg font-bold">{open === x.component.id ? '−' : '+'}</span>
                      </button>
                      {open === x.component.id && (
                        <div className="mt-2 flex flex-col gap-2">
                          <ul className="grid gap-x-6 sm:grid-cols-2">{x.ingredients.map((ing) => <li key={ing.name} className="flex justify-between gap-3 border-b border-dashed border-latte py-1"><span>{ing.name}</span><span className="font-accent font-medium">{displayAmount(ing, ing.scaled, pref)}</span></li>)}</ul>
                          <ol className="list-decimal pl-5 leading-7">
                            {x.recipe.steps.map((s, k) => (
                              <li key={k} className="py-1">
                                <CitedText text={s.text} recipeId={x.recipe.id} citations={bundle.citations} />
                                {s.timer && <Button small className="ml-2" onClick={() => t.start(s.timer!.label, s.timer!.seconds)}>⏱ {fmt(s.timer.seconds)}</Button>}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ))}
              <NextRow hint="Next: log what worked, so the next bake starts smarter.">
                <Button primary onClick={() => go('log')}>Done baking: log it →</Button>
              </NextRow>
            </div>
          ) : (
            <Card tape="gingham" className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <LabelTape>{cur.day}</LabelTape>
                <span className="font-accent text-sm font-medium text-espresso-muted">Step {i + 1} of {items.length} · {cur.component}</span>
              </div>
              <div aria-hidden className="h-2 overflow-hidden rounded-pill bg-latte-light"><span className="block h-full rounded-pill bg-ribbon" style={{ width: `${((i + 1) / Math.max(1, items.length)) * 100}%` }} /></div>
              <ol className="flex flex-col gap-2">
                {items.map((x, k) =>
                  Math.abs(k - i) <= 2 ? (
                    <li key={k}>
                      <button type="button" onClick={() => setI(k)} className={`w-full rounded-md px-3 py-2 text-left ${k === i ? 'bg-rose-light font-display text-[26px] font-semibold leading-9' : 'text-espresso-muted'}`} aria-current={k === i ? 'step' : undefined}>
                        {x.recipeId ? <CitedText text={x.step.text} recipeId={x.recipeId} citations={bundle.citations} /> : x.step.text}
                      </button>
                    </li>
                  ) : null,
                )}
              </ol>
              {cur.step.timer && <div><Button onClick={() => t.start(cur.step.timer!.label, cur.step.timer!.seconds)}>Start timer · {fmt(cur.step.timer.seconds)}</Button></div>}
              <NextRow hint={last ? 'Last step.' : `Up next: ${items[i + 1]?.component ?? ''}`}>
                <Button onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>← Back</Button>
                <Button primary onClick={() => (last ? go('log') : setI(i + 1))}>{last ? 'Finish and log it' : 'Next step →'}</Button>
              </NextRow>
            </Card>
          )}
        </div>
      </section>
    </CitationProvider>
  );
}
