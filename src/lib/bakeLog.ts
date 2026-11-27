import type { BakeLog, Citation, Component, Recipe } from './types';
import { promoteToTested } from './citations';

/**
 * Saving a bake log closes the loop (v6 Part 6):
 * - a "change" note leads that recipe next time, marked as your own (Y)
 * - a measured value turns its assumption into a tested citation
 */
export function applyBakeLog(
  log: BakeLog,
  components: Component[],
  recipes: Recipe[],
  citations: Citation[],
): { recipes: Recipe[]; citations: Citation[]; summary: string[] } {
  const summary: string[] = [];
  const recipeOut = new Map(recipes.map((r) => [r.id, r]));
  const citeOut = new Map(citations.map((c) => [`${c.recipeId}|${c.id}`, c]));
  const now = Date.now();

  for (const res of log.results) {
    if (res.verdict !== 'change' || !res.changeText.trim()) continue;
    const comp = components.find((c) => c.id === res.componentId);
    const recipe = comp?.recipeId ? recipeOut.get(comp.recipeId) : undefined;
    if (!comp || !recipe) continue;
    const note = res.changeText.replace(/[{}|]/g, '').trim();
    const yId = `Y${log.bakedOn.replace(/-/g, '')}`;
    recipeOut.set(recipe.id, {
      ...recipe,
      steps: [{ text: `{${yId}|Last time: ${note}}` }, ...recipe.steps],
      updatedAt: now,
    });
    citeOut.set(`${recipe.id}|${yId}`, {
      id: yId, recipeId: recipe.id, kind: 'tested', title: 'From your bake log',
      detail: `You wrote this after your bake on ${log.bakedOn}, so it now leads the recipe.`, why: null, refs: [], url: null,
    });
    summary.push(`${comp.name}: your note now leads the recipe.`);
  }

  for (const m of log.measured) {
    if (!m.value.trim()) continue;
    const key = `${m.recipeId}|${m.citationId}`;
    const c = citeOut.get(key);
    if (!c) continue;
    citeOut.set(key, promoteToTested(c, m.value.trim(), log.bakedOn));
    summary.push(`${c.title}: now tested by you (${m.value.trim()}), not an estimate.`);
  }

  return { recipes: [...recipeOut.values()], citations: [...citeOut.values()], summary };
}
