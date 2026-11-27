'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, newId } from './db';
import type { BakeLog, BasePan, Citation, Component, Flavor, Project, Recipe } from './types';
import type { HandoffReply } from './handoff';
import type { LinkedRecipe } from './recipeLink';
import { parseIngredientLine } from './ingredientLine';
import { applyBakeLog } from './bakeLog';
import { componentTemplates } from './templates';
import { suggestTiers } from './scaling';

export function blankProject(): Project {
  const now = Date.now();
  return {
    id: newId(), title: 'New cake', titleIsCustom: false, dessertType: 'cake', status: 'planning', buildMode: 'know',
    request: { forWho: '', occasion: '', date: '', servings: null, words: '' },
    flavors: { primary: null, pairings: [], custom: [] },
    size: { shape: 'round', tiers: suggestTiers(12), justEnough: true },
    createdAt: now, updatedAt: now,
  };
}

export async function createProject(): Promise<string> {
  const p = blankProject();
  await db().projects.add(p);
  return p.id;
}

export async function saveProject(p: Project) {
  await db().projects.put({ ...p, updatedAt: Date.now() });
}

export async function deleteProject(id: string) {
  const d = db();
  await d.transaction('rw', [d.projects, d.components, d.layers, d.bakeLogs], async () => {
    await d.components.where('projectId').equals(id).delete();
    await d.layers.where('projectId').equals(id).delete();
    await d.bakeLogs.where('projectId').equals(id).delete();
    await d.projects.delete(id);
  });
}

export function deriveTitle(p: Project, flavors: Flavor[]): string {
  const byId = new Map(flavors.map((f) => [f.id, f.name]));
  const names = [p.flavors.primary, ...p.flavors.pairings].filter(Boolean).map((id) => byId.get(id!) ?? '').filter(Boolean);
  const all = [...names, ...p.flavors.custom];
  const kind = { cake: 'cake', cheesecake: 'cheesecake', tart: 'tart', 'ice-cream-cake': 'ice cream cake' }[p.dessertType];
  return all.length ? `${all.join(' ')} ${kind}` : `New ${kind}`;
}

/** Replace a project's components with the starting set for its dessert type. */
export async function resetComponents(p: Project, flavors: Flavor[]) {
  const byId = new Map(flavors.map((f) => [f.id, f.name]));
  const libPrimary = p.flavors.primary ? byId.get(p.flavors.primary) : undefined;
  const custom = [...p.flavors.custom];
  const primary = libPrimary || custom.shift() || '';
  const pairing = (p.flavors.pairings[0] && byId.get(p.flavors.pairings[0])) || custom[0] || '';
  const words = p.request.words.toLowerCase();
  const mentioned = pairing && words.includes(pairing.toLowerCase().split(' ')[0].replace(/(ies|y|s)$/, ''));
  const comps: Component[] = componentTemplates(p.dessertType, primary, pairing).map((t) => ({
    ...t,
    // A pairing they asked for turns the insert on (v6: "From request").
    ...(t.kind === 'insert' && mentioned ? { included: true, tag: 'from-request' as const, why: `From “${p.request.words}”` } : {}),
    ...(t.kind === 'insert' && pairing && !mentioned ? { included: true } : {}),
    id: newId(), projectId: p.id, recipeId: null, feeds: [],
  }));
  const d = db();
  await d.transaction('rw', d.components, async () => {
    await d.components.where('projectId').equals(p.id).delete();
    await d.components.bulkAdd(comps);
  });
}

export const saveComponent = (c: Component) => db().components.put(c);
export const removeComponent = (id: string) => db().components.delete(id);

export async function addComponent(projectId: string, name: string) {
  await db().components.add({
    id: newId(), projectId, kind: 'other', name, why: 'Added by you', tag: 'mine', included: true, makeAheadDay: -1, recipeId: null, feeds: [],
  });
}

/** Store a validated AI reply: one recipe per component, matched to existing components by kind. */
export async function importHandoff(projectId: string, reply: HandoffReply) {
  const d = db();
  const now = Date.now();
  await d.transaction('rw', [d.components, d.recipes, d.citations], async () => {
    const existing = await d.components.where('projectId').equals(projectId).toArray();
    const used = new Set<string>();
    for (const rc of reply.components) {
      const recipe: Recipe = {
        id: newId(), title: rc.name, basePan: rc.recipe.basePan, yieldGrams: rc.recipe.yieldGrams,
        ingredients: rc.recipe.ingredients, steps: rc.recipe.steps, origin: 'ai', sourceUrl: null, createdAt: now, updatedAt: now,
      };
      await d.recipes.add(recipe);
      await d.citations.bulkPut(rc.citations.map((c) => ({
        ...c, recipeId: recipe.id, kind: c.kind === 'source' && !c.url ? 'assumption' : c.kind,
      }) as Citation));
      const match = existing.find((c) => !used.has(c.id) && c.included && c.kind === rc.kind)
        ?? existing.find((c) => !used.has(c.id) && c.name.toLowerCase() === rc.name.toLowerCase());
      if (match) {
        used.add(match.id);
        await d.components.put({ ...match, name: rc.name, why: rc.why || match.why, makeAheadDay: rc.makeAheadDay, recipeId: recipe.id });
      } else {
        await d.components.add({
          id: newId(), projectId, kind: rc.kind, name: rc.name, why: rc.why, tag: 'suggested', included: true,
          makeAheadDay: rc.makeAheadDay, recipeId: recipe.id, feeds: [],
        });
      }
    }
  });
}

/** A pasted link is cited as a source; the base pan and any cup conversions are flagged as assumptions. */
export async function importLink(component: Component, linked: LinkedRecipe, basePan: BasePan): Promise<string[]> {
  const parsed = linked.ingredientLines.map(parseIngredientLine);
  const skipped = parsed.filter((p) => !p.ingredient).map((p) => p.raw);
  const converted = parsed.filter((p) => p.converted).map((p) => p.ingredient!.name);
  const now = Date.now();
  const recipe: Recipe = {
    id: newId(), title: linked.title, basePan, yieldGrams: null,
    ingredients: parsed.flatMap((p) => (p.ingredient ? [p.ingredient] : [])),
    steps: linked.steps.map((s, i) => ({ text: i === 0 ? `{S1|${s}}` : s })),
    origin: 'link', sourceUrl: linked.url, createdAt: now, updatedAt: now,
  };
  const cites: Citation[] = [
    { id: 'S1', recipeId: recipe.id, kind: 'source', title: `A person's recipe: ${linked.title}`, detail: linked.author ? `Written by ${linked.author}.` : 'From the page you linked.', why: null, refs: [], url: linked.url },
    { id: 'A1', recipeId: recipe.id, kind: 'assumption', title: 'Base pan size', detail: `Assumed the recipe makes ${basePan.layers} × ${basePan.sizeIn} in ${basePan.shape} layers. Scaling depends on this.`, why: linked.yield ? `The page says it yields "${linked.yield}".` : 'The page does not say what pan it was written for.', refs: [], url: null },
  ];
  if (converted.length) {
    cites.push({ id: 'A2', recipeId: recipe.id, kind: 'assumption', title: 'Cups converted to grams', detail: `Converted with a standard density: ${converted.join(', ')}.`, why: 'Cups vary with how you scoop; weights are more reliable.', refs: [], url: null });
  }
  const d = db();
  await d.transaction('rw', [d.recipes, d.citations, d.components], async () => {
    await d.recipes.add(recipe);
    await d.citations.bulkPut(cites);
    await d.components.put({ ...component, recipeId: recipe.id });
  });
  return skipped;
}

export async function saveManualRecipe(component: Component, recipe: Recipe) {
  const d = db();
  await d.transaction('rw', [d.recipes, d.components], async () => {
    await d.recipes.put({ ...recipe, updatedAt: Date.now() });
    await d.components.put({ ...component, recipeId: recipe.id });
  });
}

export async function saveBakeLog(log: BakeLog): Promise<string[]> {
  const d = db();
  let summary: string[] = [];
  await d.transaction('rw', [d.bakeLogs, d.components, d.recipes, d.citations, d.projects], async () => {
    const comps = await d.components.where('projectId').equals(log.projectId).toArray();
    const recipeIds = comps.map((c) => c.recipeId).filter(Boolean) as string[];
    const recipes = (await d.recipes.bulkGet(recipeIds)).filter(Boolean) as Recipe[];
    const cites = await d.citations.where('recipeId').anyOf(recipeIds).toArray();
    const out = applyBakeLog(log, comps, recipes, cites);
    summary = out.summary;
    await d.recipes.bulkPut(out.recipes);
    await d.citations.bulkPut(out.citations);
    await d.bakeLogs.put(log);
    const p = await d.projects.get(log.projectId);
    if (p) await d.projects.put({ ...p, status: 'baked', updatedAt: Date.now() });
  });
  return summary;
}

// ---------- hooks ----------

export function useProjects() {
  return useLiveQuery(() => db().projects.orderBy('updatedAt').reverse().toArray(), []);
}

export function useFlavors() {
  return useLiveQuery(() => db().flavors.toArray(), []);
}

export function useBakeLogs() {
  return useLiveQuery(() => db().bakeLogs.orderBy('bakedOn').reverse().toArray(), []);
}

const KIND_ORDER = ['crust', 'base', 'sponge', 'soak', 'filling', 'insert', 'crunch', 'frosting', 'other'];

export interface Bundle {
  project: Project;
  components: Component[];
  recipes: Map<string, Recipe>;
  citations: Map<string, Citation>; // key: recipeId|id
  logs: BakeLog[];
}

export function useProject(id: string | null): Bundle | null | undefined {
  return useLiveQuery(async () => {
    if (!id) return null;
    const d = db();
    const project = await d.projects.get(id);
    if (!project) return null;
    const components = (await d.components.where('projectId').equals(id).toArray()).sort(
      (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.name.localeCompare(b.name),
    );
    const ids = components.map((c) => c.recipeId).filter(Boolean) as string[];
    const recipes = (await d.recipes.bulkGet(ids)).filter(Boolean) as Recipe[];
    const cites = ids.length ? await d.citations.where('recipeId').anyOf(ids).toArray() : [];
    const logs = await d.bakeLogs.where('projectId').equals(id).toArray();
    return {
      project,
      components,
      recipes: new Map(recipes.map((r) => [r.id, r])),
      citations: new Map(cites.map((c) => [`${c.recipeId}|${c.id}`, c])),
      logs,
    };
  }, [id]);
}
