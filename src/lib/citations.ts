import type { Citation } from './types';

export type Segment =
  | { plain: true; text: string }
  | { plain: false; text: string; citationId: string };

const MARK = /\{(\w+)\|([^}]+)\}/g;

/** Split step text into plain runs and cited runs: "Bake {S1|at 350°F}" */
export function parseMarks(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(MARK)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ plain: true, text: text.slice(last, i) });
    out.push({ plain: false, citationId: m[1], text: m[2] });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ plain: true, text: text.slice(last) });
  return out;
}

export function markIds(text: string): string[] {
  return [...text.matchAll(MARK)].map((m) => m[1]);
}

/** Bake log: a measured value turns an assumption into a tested citation. */
export function promoteToTested(c: Citation, measured: string, bakedOn: string): Citation {
  return {
    ...c,
    kind: 'tested',
    title: 'Tested by you',
    detail: `Your bake on ${bakedOn}: ${measured}.`,
    why: c.why,
  };
}
