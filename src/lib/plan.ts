import type { Component, Ingredient, Project, Recipe } from './types';
import { roundAmount, scaleFactor } from './scaling';
import { assemblyText, processTasks } from './processRules';

export interface ScaledIngredient extends Ingredient {
  scaled: number;
}

export interface ComponentPlan {
  component: Component;
  recipe: Recipe;
  factor: number;
  ingredients: ScaledIngredient[];
  warnings: string[];
}

/**
 * Scale each included component's recipe to the project's pans.
 * A foundation component that feeds others is scaled up by what it feeds,
 * which needs the recipe's yield in grams.
 */
export function planComponents(
  project: Project,
  components: Component[],
  recipes: Map<string, Recipe>,
): ComponentPlan[] {
  const included = components.filter((c) => c.included && c.recipeId && recipes.has(c.recipeId));
  return included.map((component) => {
    const recipe = recipes.get(component.recipeId!)!;
    const warnings: string[] = [];
    let factor = scaleFactor(recipe.basePan, project.size);
    const fed = component.feeds.reduce((s, f) => s + f.grams, 0);
    if (fed > 0) {
      if (recipe.yieldGrams) {
        factor += fed / recipe.yieldGrams;
      } else {
        warnings.push(`${component.name} feeds other components, but its recipe has no yield, so the extra amount isn't included.`);
      }
    }
    const ingredients = recipe.ingredients.map((i) => ({
      ...i,
      scaled: roundAmount(i.amount * factor, i.unit),
    }));
    return { component, recipe, factor, ingredients, warnings };
  });
}

export interface ShoppingItem {
  name: string;
  unit: Ingredient['unit'];
  needsScale: boolean;
  total: number;
  usedBy: string[];
}

/** Merge by exact ingredient name + unit. "lemons, zested" and "lemon juice" stay separate in v1. */
export function shoppingList(plans: ComponentPlan[]): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();
  for (const p of plans) {
    for (const i of p.ingredients) {
      const key = `${i.name.toLowerCase().trim()}|${i.unit}`;
      const item = map.get(key) ?? { name: i.name, unit: i.unit, needsScale: false, total: 0, usedBy: [] };
      item.total += i.scaled;
      item.needsScale ||= i.needsScale;
      if (!item.usedBy.includes(p.component.name)) item.usedBy.push(p.component.name);
      map.set(key, item);
    }
  }
  return [...map.values()].sort((a, b) => b.usedBy.length - a.usedBy.length || a.name.localeCompare(b.name));
}

export interface TimelineDay {
  offset: number; // 0 = serving day
  label: string;
  tasks: { componentId: string | null; text: string; sourceUrl?: string }[];
}

export function dayLabel(offset: number, servingDate?: string): string {
  if (offset === 0) return servingDate ? `Serving day · ${servingDate}` : 'Serving day';
  if (offset === -1) return 'Day before';
  return `${-offset} days before`;
}

/** Group components by make-ahead day; assembly is always last on serving day. */
export function bakeTimeline(project: Project, components: Component[]): TimelineDay[] {
  const included = components.filter((c) => c.included);
  const rules = processTasks(project);
  const offsets = [...new Set([...included.map((c) => c.makeAheadDay), ...rules.map((r) => r.offset), 0])].sort((a, b) => a - b);
  return offsets.map((offset) => ({
    offset,
    label: dayLabel(offset, project.request.date || undefined),
    tasks: [
      ...included.filter((c) => c.makeAheadDay === offset).map((c) => ({ componentId: c.id, text: `Make the ${c.name.toLowerCase()}` })),
      ...rules.filter((r) => r.offset === offset).map((r) => ({ componentId: null, text: r.text, sourceUrl: r.source.url })),
      ...(offset === 0 ? [{ componentId: null, text: assemblyText(project) }] : []),
    ],
  }));
}

/** Gaps shown in the components step (from v6). */
export function componentGaps(project: Project, components: Component[]): string[] {
  const on = components.filter((c) => c.included);
  const has = (k: Component['kind']) => on.some((c) => c.kind === k);
  const gaps: string[] = [];
  if (project.dessertType === 'cake') {
    if (!has('sponge') && !has('base')) gaps.push('No base layer. Add a sponge or choose a cheesecake or tart.');
    if (has('sponge') && !has('soak') && !has('filling') && !has('insert')) gaps.push('No soak, filling or insert. Sponge-only layers can taste dry.');
  }
  return gaps;
}
