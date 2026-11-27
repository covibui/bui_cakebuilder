import { describe, expect, it } from 'vitest';
import { panArea, roundAmount, scaleFactor, suggestTiers } from '../scaling';
import { displayAmount, cToF } from '../units';
import { parseMarks, markIds } from '../citations';
import { bakeTimeline, componentGaps, planComponents, shoppingList } from '../plan';
import { buildPrompt, parseReply } from '../handoff';
import { extractRecipe } from '../recipeLink';
import { balanceWarnings } from '../balance';
import { SEED_FLAVORS } from '../flavors';
import type { Component, Project, Recipe } from '../types';

const project: Project = {
  id: 'p1', title: 'Lemon Raspberry cake', titleIsCustom: false, dessertType: 'cake', status: 'planning', buildMode: 'know',
  request: { forWho: 'Sam', occasion: '30th birthday', date: '2026-12-12', servings: 16, words: 'Lemony and bright. Not too sweet.' },
  flavors: { primary: 'cake-lemon', pairings: [], custom: [] },
  size: { shape: 'round', tiers: [{ sizeIn: 8, layers: 3 }], justEnough: true },
  createdAt: 0, updatedAt: 0,
};

const curd: Recipe = {
  id: 'r-curd', title: 'Lemon curd', basePan: { shape: 'round', sizeIn: 8, layers: 3 }, yieldGrams: 400,
  ingredients: [{ name: 'lemon juice', amount: 120, unit: 'ml', needsScale: false }, { name: 'eggs', amount: 3, unit: 'count', needsScale: false }, { name: 'sugar', amount: 100, unit: 'g', needsScale: false }],
  steps: [{ text: 'Chill {A2|about 4 hours} to set.' }], origin: 'ai', sourceUrl: null, createdAt: 0, updatedAt: 0,
};
const sponge: Recipe = { ...curd, id: 'r-sponge', title: 'Sponge', yieldGrams: null, ingredients: [{ name: 'sugar', amount: 250, unit: 'g', needsScale: false }] };

const comp = (o: Partial<Component>): Component => ({ id: 'c', projectId: 'p1', kind: 'sponge', name: 'Sponge', why: '', tag: 'base', included: true, makeAheadDay: -1, recipeId: 'r-sponge', feeds: [], ...o });

describe('scaling', () => {
  it('scales by pan area and layers', () => {
    expect(scaleFactor({ shape: 'round', sizeIn: 8, layers: 3 }, project.size)).toBeCloseTo(1);
    const two = scaleFactor({ shape: 'round', sizeIn: 8, layers: 3 }, { ...project.size, tiers: [{ sizeIn: 8, layers: 3 }, { sizeIn: 6, layers: 3 }] });
    expect(two).toBeCloseTo(1 + 36 / 64);
  });
  it('adds 10% when just enough is off', () => {
    expect(scaleFactor({ shape: 'round', sizeIn: 8, layers: 3 }, { ...project.size, justEnough: false })).toBeCloseTo(1.1);
  });
  it('rounds weights up to 5 and counts up to whole', () => {
    expect(roundAmount(101, 'g')).toBe(105);
    expect(roundAmount(100, 'g')).toBe(100);
    expect(roundAmount(3.2, 'count')).toBe(4);
  });
  it('square pan is larger than round', () => expect(panArea('square', 8) / panArea('round', 8)).toBeCloseTo(1.27, 2));
  it('suggests tiers from servings', () => expect(suggestTiers(30)).toHaveLength(3));
});

describe('units', () => {
  it('shows cups by default and grams on toggle', () => {
    const sugar = { name: 'sugar', amount: 200, unit: 'g' as const, needsScale: false };
    expect(displayAmount(sugar, 200, 'cups')).toBe('1 cup');
    expect(displayAmount(sugar, 100, 'cups')).toBe('½ cup');
    expect(displayAmount(sugar, 200, 'grams')).toBe('200 g');
  });
  it('always shows grams when a scale is needed', () => {
    expect(displayAmount({ name: 'dark chocolate', amount: 150, unit: 'g', needsScale: true }, 150, 'cups')).toBe('150 g');
  });
  it('small amounts become tbsp', () => {
    expect(displayAmount({ name: 'lemon juice', amount: 30, unit: 'ml', needsScale: false }, 30, 'cups')).toBe('2 tbsp');
  });
  it('converts to °F', () => expect(cToF(175)).toBe(347));
});

describe('citations', () => {
  it('splits marks from plain text', () => {
    const s = parseMarks('Bake {S1|at 350°F for 25 min} per layer.');
    expect(s).toHaveLength(3);
    expect(s[1]).toMatchObject({ plain: false, citationId: 'S1', text: 'at 350°F for 25 min' });
    expect(markIds('a {A1|x} b {S2|y}')).toEqual(['A1', 'S2']);
  });
});

describe('plan', () => {
  const recipes = new Map([[curd.id, curd], [sponge.id, sponge]]);
  it('foundation component scales up by what it feeds', () => {
    const c = comp({ id: 'c-curd', kind: 'filling', name: 'Lemon curd', recipeId: 'r-curd', makeAheadDay: -2, feeds: [{ componentId: 'c-frost', grams: 200 }] });
    const [p] = planComponents(project, [c], recipes);
    expect(p.factor).toBeCloseTo(1.5);
    expect(p.ingredients.find((i) => i.name === 'sugar')!.scaled).toBe(150);
  });
  it('warns when a feeding recipe has no yield', () => {
    const [p] = planComponents(project, [comp({ feeds: [{ componentId: 'x', grams: 50 }] })], recipes);
    expect(p.warnings).toHaveLength(1);
  });
  it('merges the shopping list', () => {
    const plans = planComponents(project, [comp({ id: 'a' }), comp({ id: 'b', name: 'Curd', recipeId: 'r-curd' })], recipes);
    const sugar = shoppingList(plans).find((i) => i.name === 'sugar')!;
    expect(sugar.total).toBe(350);
    expect(sugar.usedBy).toEqual(['Sponge', 'Curd']);
  });
  it('builds the timeline with assembly last', () => {
    const t = bakeTimeline(project, [comp({ makeAheadDay: -2 }), comp({ id: 'x', name: 'Buttercream', makeAheadDay: 0 })]);
    expect(t.map((d) => d.label)).toEqual(['2 days before', 'Serving day · 2026-12-12']);
    expect(t.at(-1)!.tasks.at(-1)!.text).toBe('Assemble and chill');
  });
  it('flags a sponge with nothing to keep it moist', () => {
    expect(componentGaps(project, [comp({})])).toHaveLength(1);
  });
});

describe('handoff', () => {
  const good = {
    components: [{
      kind: 'filling', name: 'Lemon curd', why: 'Bright lemon', makeAheadDay: -2,
      recipe: { basePan: { shape: 'round', sizeIn: 8, layers: 3 }, yieldGrams: 400, ingredients: [{ name: 'lemon juice', amount: 120, unit: 'ml' }], steps: [{ text: 'Chill {A1|4 hours}. Bake {S9|at 350°F}.' }] },
      citations: [{ id: 'A1', kind: 'assumption', title: 'Set time', detail: 'Estimated', why: 'Range 3–6 h', refs: [] }],
    }],
  };
  it('builds a prompt with the rules', () => {
    expect(buildPrompt(project, ['Lemon', 'Raspberry'], [])).toContain('{ID|text}');
  });
  it('accepts a fenced reply and reports unmatched marks', () => {
    const r = parseReply('Here you go:\n```json\n' + JSON.stringify(good) + '\n```');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.problems).toEqual(['Lemon curd: mark S9 has no matching citation.']);
  });
  it('rejects broken JSON with a plain message', () => {
    const r = parseReply('{nope');
    expect(r.ok).toBe(false);
  });
  it('rejects missing units', () => {
    const bad = structuredClone(good) as { components: { recipe: { ingredients: Record<string, unknown>[] } }[] };
    delete bad.components[0].recipe.ingredients[0].unit;
    expect(parseReply(JSON.stringify(bad)).ok).toBe(false);
  });
});

describe('recipe links', () => {
  it('reads schema.org Recipe from JSON-LD, including @graph', () => {
    const html = `<script type="application/ld+json">${JSON.stringify({ '@graph': [{ '@type': 'WebPage' }, { '@type': ['Recipe'], name: 'Lemon Curd', author: { name: 'A Baker' }, recipeIngredient: ['120 ml lemon juice'], recipeInstructions: [{ '@type': 'HowToStep', text: 'Whisk.' }] }] })}</script>`;
    const r = extractRecipe(html, 'https://example.com/curd');
    expect(r).toMatchObject({ title: 'Lemon Curd', author: 'A Baker', ingredientLines: ['120 ml lemon juice'], steps: ['Whisk.'] });
  });
  it('returns null when there is no recipe data', () => expect(extractRecipe('<p>hi</p>', 'x')).toBeNull());
});

describe('flavors and balance', () => {
  it('seeds 25 flavors with unique ids', () => {
    expect(SEED_FLAVORS).toHaveLength(25);
    expect(new Set(SEED_FLAVORS.map((f) => f.id)).size).toBe(25);
  });
  it('warns about sweet pairings on a not-too-sweet request', () => {
    const wc = SEED_FLAVORS.find((f) => f.name === 'White chocolate')!;
    expect(balanceWarnings([wc], project.request)).toHaveLength(1);
  });
});
