import { z } from 'zod';
import type { Project } from './types';
import { markIds } from './citations';

/**
 * Copy-prompt handoff (v1, "being cheap" edition): the app writes the prompt,
 * the baker pastes it into Claude, then pastes the JSON reply back.
 * A built-in API key can return the same format later — nothing else changes.
 */

const Ingredient = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  unit: z.enum(['g', 'ml', 'count']),
  needsScale: z.boolean().default(false),
});

const Step = z.object({
  text: z.string().min(1),
  timer: z.object({ label: z.string(), seconds: z.number().int().positive() }).optional(),
});

const Citation = z.object({
  id: z.string().regex(/^\w+$/),
  kind: z.enum(['source', 'assumption']),
  title: z.string(),
  detail: z.string(),
  why: z.string().nullable().default(null),
  refs: z.array(z.string()).default([]),
  url: z.string().url().nullable().default(null),
});

const ComponentReply = z.object({
  kind: z.enum(['sponge', 'soak', 'filling', 'insert', 'frosting', 'crunch', 'crust', 'base', 'other']),
  name: z.string(),
  why: z.string(),
  makeAheadDay: z.number().int().min(-7).max(0),
  recipe: z.object({
    basePan: z.object({
      shape: z.enum(['round', 'square', 'sheet', 'oval', 'dome', 'cupcake']),
      sizeIn: z.number().positive(),
      layers: z.number().int().positive(),
    }),
    yieldGrams: z.number().positive().nullable().default(null),
    ingredients: z.array(Ingredient).min(1),
    steps: z.array(Step).min(1),
  }),
  citations: z.array(Citation),
});

export const HandoffReply = z.object({ components: z.array(ComponentReply).min(1) });
export type HandoffReply = z.infer<typeof HandoffReply>;

export function buildPrompt(project: Project, flavorNames: string[], componentNames: string[]): string {
  const r = project.request;
  return [
    `You are helping plan a ${project.dessertType.replace(/-/g, ' ')}.`,
    `Request: for ${r.forWho || 'someone'}, ${r.occasion || 'an occasion'}, ${r.servings ?? '?'} servings. Their words: "${r.words}".`,
    `Flavors: ${flavorNames.join(', ') || 'not chosen yet'}.`,
    componentNames.length ? `Components wanted: ${componentNames.join(', ')}.` : 'Suggest the components.',
    '',
    'Rules:',
    '- Every amount, time and temperature must carry a citation mark in the step text: {ID|text}.',
    '- Use kind "source" only when it comes straight from a published recipe by a person, and give its url.',
    '- Anything you estimated, scaled or changed is kind "assumption", with a "why" and the refs you compared.',
    '- Amounts in grams (g), millilitres (ml) or counts. Mark chocolate, gelatin and leaveners needsScale: true.',
    '- Temperatures in °F. makeAheadDay: 0 = serving day, -1 = day before, -2 = two days before.',
    '',
    'Reply with ONE JSON code block and nothing else, in this shape:',
    '{"components":[{"kind":"filling","name":"Lemon curd","why":"...","makeAheadDay":-2,',
    '"recipe":{"basePan":{"shape":"round","sizeIn":8,"layers":3},"yieldGrams":450,',
    '"ingredients":[{"name":"lemon juice","amount":120,"unit":"ml","needsScale":false}],',
    '"steps":[{"text":"Chill {A1|about 4 hours} to set.","timer":{"label":"Curd chill","seconds":14400}}]},',
    '"citations":[{"id":"A1","kind":"assumption","title":"Curd set time","detail":"...","why":"...","refs":["..."],"url":null}]}]}',
  ].join('\n');
}

export type ParseResult =
  | { ok: true; reply: HandoffReply; problems: string[] }
  | { ok: false; problems: string[] };

/** Pull the JSON out of whatever was pasted, validate it, and list problems instead of dropping them. */
export function parseReply(pasted: string): ParseResult {
  const fenced = pasted.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : pasted).trim();
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, problems: ['The reply is not valid JSON. Ask Claude to send one JSON code block only.'] };
  }
  const parsed = HandoffReply.safeParse(json);
  if (!parsed.success) {
    return { ok: false, problems: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) };
  }
  const problems: string[] = [];
  for (const c of parsed.data.components) {
    const ids = new Set(c.citations.map((x) => x.id));
    for (const s of c.recipe.steps) {
      for (const id of markIds(s.text)) {
        if (!ids.has(id)) problems.push(`${c.name}: mark ${id} has no matching citation.`);
      }
    }
    for (const x of c.citations) {
      if (x.kind === 'source' && !x.url) problems.push(`${c.name}: source ${x.id} has no link, so it will show as an assumption.`);
    }
  }
  return { ok: true, reply: parsed.data, problems };
}
