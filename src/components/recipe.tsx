'use client';

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Citation, Component, Size } from '@/lib/types';
import { parseMarks } from '@/lib/citations';
import { crossSection } from '@/lib/stack';
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

const FILL: Record<string, string> = {
  frosting: '#f4f4f4', sponge: '#e2e2e2', soak: '#cfd8e3', filling: '#fff3b0', insert: '#f3c6cf',
  crunch: '#d6c3a5', crust: '#c9b28f', base: '#efe6d6', other: '#dddddd',
};

export function CrossSection({ components, size, highlight, scale = 1.4 }: { components: Component[]; size: Size; highlight?: string; scale?: number }) {
  const bands = crossSection(components, size);
  if (!bands.length) return <p className="text-neutral-600">Turn on a component to see the cross-section.</p>;
  return (
    <figure className="w-full max-w-xs" aria-label="Cross-section, top to bottom">
      <div className="overflow-hidden rounded-t-xl border-2 border-neutral-800">
        {bands.map((b, i) => (
          <div
            key={i}
            style={{ height: Math.round(b.height * scale), background: FILL[b.kind] }}
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
