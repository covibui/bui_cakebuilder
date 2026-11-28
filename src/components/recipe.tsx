'use client';

import { createContext, useContext, useId, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Citation, Component, Size } from '@/lib/types';
import { parseMarks } from '@/lib/citations';
import { crossSection, rollSpiral } from '@/lib/stack';
import { CAKE_COLORS, cakeColorStyle } from '@/lib/cakeColors';
import { buildIsoCake, buildIsoSlice, isoCakeInner, type IsoBand, type IsoCake, type IsoPattern } from '@/lib/isoCake';
import type { Band } from '@/lib/stack';
import type { UnitPref } from '@/lib/units';
import { Button, Chip } from './ui';

// ---------- unit preference (per device) ----------

const KEY = 'cake-builder:units';

const listeners = new Set<() => void>();
const readPref = (): UnitPref => {
  try {
    return localStorage.getItem(KEY) === 'grams' ? 'grams' : 'cups';
  } catch {
    return 'cups';
  }
};

export function useUnitPref(): [UnitPref, (u: UnitPref) => void] {
  const pref = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readPref,
    () => 'cups' as UnitPref,
  );
  const set = (u: UnitPref) => {
    try {
      localStorage.setItem(KEY, u);
    } catch {}
    listeners.forEach((l) => l());
  };
  return [pref, set];
}

export function UnitToggle({ pref, setPref }: { pref: UnitPref; setPref: (u: UnitPref) => void }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Units">
      <Chip on={pref === 'cups'} onClick={() => setPref('cups')}>Cups</Chip>
      <Chip on={pref === 'grams'} onClick={() => setPref('grams')}>Grams</Chip>
    </div>
  );
}

// ---------- citations ----------

const CiteCtx = createContext<{ open: (c: Citation | null, id: string) => void }>({ open: () => {} });

export function CitationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ c: Citation | null; id: string } | null>(null);
  return (
    <CiteCtx.Provider value={{ open: (c, id) => setState({ c, id }) }}>
      {children}
      {state && <CitationPanel citation={state.c} id={state.id} onClose={() => setState(null)} />}
    </CiteCtx.Provider>
  );
}

const MARK = { source: '✓', assumption: '?', tested: '★' } as const;
const LABEL = { source: 'from a source', assumption: 'assumption', tested: 'tested by you' } as const;

function CitationPanel({ citation, id, onClose }: { citation: Citation | null; id: string; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Citation" className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border-2 border-neutral-800 bg-white p-5" onClick={(e) => e.stopPropagation()}>
        {citation ? (
          <>
            <p className="text-sm font-semibold">{MARK[citation.kind]} {id} · {LABEL[citation.kind]}</p>
            <p className="mt-1 text-lg font-semibold">{citation.title}</p>
            <p className="mt-2">{citation.detail}</p>
            {citation.why && <p className="mt-2 text-neutral-700"><b>Why:</b> {citation.why}</p>}
            {citation.refs.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700">{citation.refs.map((r) => <li key={r}>{r}</li>)}</ul>
            )}
            {citation.url && <a className="mt-2 block underline" href={citation.url} target="_blank" rel="noreferrer">Open the source</a>}
          </>
        ) : (
          <p>No citation found for mark {id}. Treat this as an assumption.</p>
        )}
        <Button className="mt-4" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

/** Step text with tappable citation marks. */
export function CitedText({ text, recipeId, citations }: { text: string; recipeId: string; citations: Map<string, Citation> }) {
  const { open } = useContext(CiteCtx);
  return (
    <>
      {parseMarks(text).map((s, i) => {
        if (s.plain) return <span key={i}>{s.text}</span>;
        const c = citations.get(`${recipeId}|${s.citationId}`) ?? null;
        const kind = c?.kind ?? 'assumption';
        return (
          <button
            key={i}
            type="button"
            onClick={() => open(c, s.citationId)}
            className={`mx-0.5 rounded px-1 underline decoration-2 underline-offset-4 ${kind === 'assumption' ? 'decoration-dotted' : 'decoration-solid'} ${kind === 'tested' ? 'bg-neutral-200' : ''}`}
            aria-label={`${s.text}, ${LABEL[kind]}, ${s.citationId}`}
          >
            {s.text}
            <sup className="ml-0.5 font-semibold">{MARK[kind]}{s.citationId}</sup>
          </button>
        );
      })}
    </>
  );
}

export function CitationKey() {
  return (
    <p className="text-sm text-neutral-600">
      <b>✓</b> from a recipe a person wrote · <b>?</b> an assumption, tap to see why · <b>★</b> tested by you
    </p>
  );
}

// ---------- cross-section ----------

/** Roll cake cross-section: the sponge is one spiral; each filling runs alongside it, between the turns. */
function Swirl({ components, highlight, scale }: { components: Component[]; highlight?: string; scale: number }) {
  const bands = rollSpiral(components);
  if (!bands.length) return <p className="text-neutral-600">Turn on a sponge to see the swirl.</p>;
  const size = 220 * scale;
  const c = size / 2;
  const total = 3 * 2 * Math.PI; // three turns
  const pitch = (c - 14) / 3.4; // radial gap between turns
  const b = pitch / (2 * Math.PI);
  const parts = [...new Map(bands.map((x) => [x.componentId, x])).values()]; // sponge first, then fillings
  const fills = parts.length - 1;
  const spiral = (offset: number) => {
    const steps = 240;
    return Array.from({ length: steps + 1 }, (_, k) => {
      const th = (total * k) / steps;
      const r = 4 + b * th + offset;
      return `${k ? 'L' : 'M'}${(c + r * Math.cos(th)).toFixed(1)},${(c + r * Math.sin(th)).toFixed(1)}`;
    }).join(' ');
  };
  const segs = parts.map((part, i) => {
    const w = i === 0 ? pitch * 0.62 : (pitch * 0.32) / fills;
    const offset = i === 0 ? 0 : pitch * 0.31 + (pitch * 0.34 * (i - 0.5)) / fills;
    return <path key={part.componentId} d={spiral(offset)} fill="none" stroke={part.componentId === highlight ? 'var(--ribbon)' : `var(--${part.color})`} strokeWidth={w} strokeLinecap="round" />;
  });
  const legend = [...new Map(bands.map((x) => [x.componentId, x])).values()];
  return (
    <figure className="w-full max-w-xs" aria-label="Cross-section of the roll, a swirl">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full rounded-full border-2 border-neutral-800 bg-neutral-50">
        {segs}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {legend.map((x) => (
          <li key={x.componentId} className={`flex items-center gap-1 ${x.componentId === highlight ? 'font-bold' : ''}`}>
            <span className="inline-block h-3 w-3 border border-neutral-500" style={{ background: `var(--${x.color})` }} />
            {x.label}
          </li>
        ))}
      </ul>
      <figcaption className="mt-1 text-sm text-neutral-600">Cross-section of the roll</figcaption>
    </figure>
  );
}

function IsoSvg({ cake, title }: { cake: IsoCake; title: string }) {
  const prefix = 'iso' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const w = cake.width + (cake.labels.length ? 60 : 0);
  return (
    <svg viewBox={`0 0 ${w} ${cake.height}`} className="h-auto w-full" role="img" aria-label={title}
      dangerouslySetInnerHTML={{ __html: isoCakeInner(cake, prefix) }} />
  );
}

/** Café Scrapbook pattern per layer: frosting gingham, sponge stripes, fruit diagonal, cream chevron, crust argyle. Thin layers stay solid. */
function patternFor(b: Band, i: number): IsoPattern {
  if (b.height < 8) return 'none';
  if (i === 0 && b.kind === 'frosting') return 'gingham';
  if (b.kind === 'sponge') return 'stripes';
  if (b.kind === 'crust' || b.kind === 'crunch') return 'argyle';
  const group = CAKE_COLORS[b.color].group;
  return group === 'fruit' ? 'diagonal' : group === 'sponge' ? 'stripes' : group === 'crust' ? 'argyle' : 'chevron';
}

/** Round cake in 3D with the front quarter cut away, or one slice. Layers carry their cake colors. */
function IsoCrossSection({ components, size, highlight, labels }: { components: Component[]; size: Size; highlight?: string; labels: boolean }) {
  const [view, setView] = useState<'cake' | 'slice'>('cake');
  const bands = crossSection(components, size);
  if (!bands.length) return <p className="text-neutral-600">Turn on a component to see the cross-section.</p>;
  const iso: IsoBand[] = bands.map((b, i) => ({
    id: b.componentId, label: b.label, height: b.height, fill: `var(--${b.color})`, isFrosting: i === 0 && b.kind === 'frosting', pattern: patternFor(b, i),
  }));
  const cake = view === 'cake' ? buildIsoCake(iso, { labels, highlight }) : buildIsoSlice(iso, { labels, highlight });
  const legend = [...new Map(bands.map((x) => [x.componentId, x])).values()];
  return (
    <figure className="w-full">
      <div className="mb-2 flex gap-2" role="tablist" aria-label="Cross-section view">
        {([['cake', 'Whole cake'], ['slice', 'Slice']] as const).map(([v, l]) => (
          <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)}
            className={`rounded-pill px-3 py-1 text-xs font-extrabold ${view === v ? 'bg-rose' : 'bg-paper'}`}>{l}</button>
        ))}
      </div>
      <IsoSvg cake={cake} title={view === 'cake' ? 'Cake with a quarter cut away, showing the layers' : 'One slice, showing the layers'} />
      {!labels && (
        <ul className="mt-2 flex flex-col gap-1 text-xs">
          {legend.map((x) => (
            <li key={x.componentId} className={`flex items-center gap-2 ${x.componentId === highlight ? 'font-bold' : ''}`}>
              <span className="inline-block h-3 w-3 rounded-xs" style={{ background: `var(--${x.color})`, boxShadow: 'inset 0 0 0 1px rgba(74,52,44,.2)' }} />
              {x.label}
            </li>
          ))}
        </ul>
      )}
      <figcaption className="mt-1 text-sm text-espresso-muted">Top tier, {size.tiers[0]?.sizeIn ?? 8} in round</figcaption>
    </figure>
  );
}

export function CrossSection({ components, size, highlight, scale = 1.4, form = 'stack', labels = false }: { components: Component[]; size: Size; highlight?: string; scale?: number; form?: 'stack' | 'swirl' | 'iso'; labels?: boolean }) {
  if (form === 'swirl') return <Swirl components={components} highlight={highlight} scale={Math.min(scale, 1.4) / 1.4} />;
  if (form === 'iso') return <IsoCrossSection components={components} size={size} highlight={highlight} labels={labels} />;
  const bands = crossSection(components, size);
  if (!bands.length) return <p className="text-neutral-600">Turn on a component to see the cross-section.</p>;
  return (
    <figure className="w-full max-w-xs" aria-label="Cross-section, top to bottom">
      <div className="overflow-hidden rounded-t-xl border-2 border-neutral-800">
        {bands.map((b, i) => (
          <div
            key={i}
            style={{ height: Math.round(b.height * scale), ...cakeColorStyle(b.color) }}
            className={`flex items-center justify-center border-b border-neutral-400 text-xs ${b.componentId === highlight ? 'font-bold outline-3 outline-offset-[-3px] outline-neutral-800' : ''}`}
          >
            {b.height * scale >= 14 ? b.label : ''}
          </div>
        ))}
      </div>
      <figcaption className="mt-1 text-sm text-neutral-600">Cross-section, top tier</figcaption>
    </figure>
  );
}
