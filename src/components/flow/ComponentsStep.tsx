'use client';

import { useState } from 'react';
import type { Bundle } from '@/lib/repo';
import { addComponent, removeComponent, resetComponents, saveComponent, useFlavors } from '@/lib/repo';
import { componentGaps } from '@/lib/plan';
import { KIND_LABEL } from '@/lib/templates';
import type { Component, ComponentKind } from '@/lib/types';
import { Button, Card, H1, Input, NextRow, Note, Select, Tag } from '@/components/ui';
import { closestCakeColor } from '@/lib/cakeColors';
import type { StepProps } from './ProjectFlow';

const TAG = { base: 'Base', suggested: 'Suggested', 'from-request': 'From request', optional: 'Optional', mine: 'Yours' } as const;
const DAYS = [[-3, '3 days before'], [-2, '2 days before'], [-1, 'Day before'], [0, 'Serving day']] as const;

export default function ComponentsStep({ bundle, go }: { bundle: Bundle } & StepProps) {
  const p = bundle.project;
  const flavors = useFlavors() ?? [];
  const [name, setName] = useState('');
  const comps = bundle.components;
  const gaps = componentGaps(p, comps);
  const set = (c: Component, patch: Partial<Component>) => saveComponent({ ...c, ...patch });

  const toggleFeed = (c: Component, target: string) => {
    const has = c.feeds.some((f) => f.componentId === target);
    set(c, { feeds: has ? c.feeds.filter((f) => f.componentId !== target) : [...c.feeds, { componentId: target, grams: 100 }] });
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <H1>What goes inside</H1>
        <p className="text-espresso-muted">Suggested from your flavors. Turn parts on or off, rename them, and say when each gets made.</p>
      </div>

      <ul className="flex flex-col gap-3">
        {comps.map((c) => (
          <li key={c.id}>
            <Card className={c.included ? '' : 'opacity-70'}>
              <div className="flex flex-wrap items-start gap-3">
                <input type="checkbox" className="mt-3 h-5 w-5 accent-ribbon" checked={c.included} onChange={() => set(c, { included: !c.included })} aria-label={`Include ${c.name}`} />
                <span aria-hidden className="mt-2 h-7 w-3 shrink-0 rounded-pill shadow-[inset_0_0_0_1px_rgba(74,52,44,.15)]" style={{ background: `var(--${closestCakeColor(c.name, c.kind)})` }} />
                <div className="flex min-w-60 flex-1 flex-col gap-1">
                  <Input value={c.name} onChange={(e) => set(c, { name: e.target.value })} aria-label="Component name" className="font-bold" />
                  <p className="flex flex-wrap items-center gap-2 text-sm text-espresso-muted"><Tag tone={c.tag === 'base' ? 'pistachio' : c.tag === 'optional' ? 'butter' : 'rose'}>{TAG[c.tag]}</Tag>{c.why}</p>
                </div>
                <Select value={c.kind} onChange={(e) => set(c, { kind: e.target.value as ComponentKind })} aria-label="Kind">
                  {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </Select>
                <Select value={c.makeAheadDay} onChange={(e) => set(c, { makeAheadDay: Number(e.target.value) })} aria-label="When to make it">
                  {DAYS.map(([d, l]) => <option key={d} value={d}>{l}</option>)}
                </Select>
                {c.tag === 'mine' && <Button small onClick={() => removeComponent(c.id)} aria-label={`Remove ${c.name}`}>Remove</Button>}
              </div>
              {c.included && comps.filter((o) => o.id !== c.id && o.included).length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold">Also used in another part{c.feeds.length ? ` (${c.feeds.length})` : ''}</summary>
                  <div className="mt-2 flex flex-col gap-2">
                    {comps.filter((o) => o.id !== c.id && o.included).map((o) => {
                      const feed = c.feeds.find((f) => f.componentId === o.id);
                      return (
                        <div key={o.id} className="flex flex-wrap items-center gap-2">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className="h-5 w-5 accent-ribbon" checked={!!feed} onChange={() => toggleFeed(c, o.id)} />
                            {o.name}
                          </label>
                          {feed && (
                            <label className="flex items-center gap-1 text-sm">
                              <Input type="number" min={1} className="w-24" value={feed.grams} onChange={(e) => set(c, { feeds: c.feeds.map((f) => (f.componentId === o.id ? { ...f, grams: Number(e.target.value) } : f)) })} />
                              g extra
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </Card>
          </li>
        ))}
      </ul>

      <div className="flex max-w-md gap-2">
        <Input className="flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a part, e.g. Feuilletine crunch" aria-label="New component" />
        <Button onClick={() => { if (name.trim()) { addComponent(p.id, name.trim()); setName(''); } }}>Add</Button>
      </div>

      {gaps.map((g) => <Note key={g} tone="warn">{g}</Note>)}

      <NextRow hint={`${comps.filter((c) => c.included).length} parts in the cake`}>
        {p.buildMode !== 'blank' && <Button onClick={() => resetComponents(p, flavors)}>Reset to suggested</Button>}
        <Button primary onClick={() => go('size')} disabled={!comps.some((c) => c.included)}>Next: size and servings →</Button>
      </NextRow>
    </section>
  );
}
