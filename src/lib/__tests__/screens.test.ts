import { describe, expect, it } from 'vitest';
import { parseIngredientLine } from '../ingredientLine';
import { crossSection } from '../stack';
import { applyBakeLog } from '../bakeLog';
import { componentTemplates } from '../templates';
import type { Citation, Component, Recipe } from '../types';

describe('ingredient lines from links', () => {
  it('keeps metric as-is', () => {
    expect(parseIngredientLine('120 ml lemon juice').ingredient).toMatchObject({ amount: 120, unit: 'ml', name: 'lemon juice' });
    expect(parseIngredientLine('300g flour').ingredient).toMatchObject({ amount: 300, unit: 'g' });
  });
  it('converts cups with a density and flags it', () => {
    const r = parseIngredientLine('1 ½ cups sugar');
    expect(r.ingredient).toMatchObject({ amount: 300, unit: 'g', name: 'sugar' });
    expect(r.converted).toBe(true);
  });
  it('turns liquid cups into ml without flagging', () => {
    const r = parseIngredientLine('1/2 cup heavy cream');
    expect(r.ingredient).toMatchObject({ amount: 118, unit: 'ml' });
    expect(r.converted).toBe(false);
  });
  it('reads counts and needs-scale ingredients', () => {
    expect(parseIngredientLine('4 large eggs').ingredient).toMatchObject({ amount: 4, unit: 'count', name: 'large eggs' });
    expect(parseIngredientLine('100 g dark chocolate, chopped').ingredient?.needsScale).toBe(true);
  });
  it('returns null for lines it cannot read', () => {
    expect(parseIngredientLine('Pinch of salt').ingredient).toBeNull();
  });
});

const comp = (o: Partial<Component>): Component => ({ id: o.kind ?? 'x', projectId: 'p', kind: 'sponge', name: 'n', why: '', tag: 'base', included: true, makeAheadDay: 0, recipeId: null, feeds: [], ...o });

describe('cross-section', () => {
  it('stacks a 3-layer cake: frosting on top, fillings between layers only', () => {
    const bands = crossSection([comp({ kind: 'sponge' }), comp({ kind: 'soak' }), comp({ kind: 'filling' }), comp({ kind: 'frosting' })], { shape: 'round', tiers: [{ sizeIn: 8, layers: 3 }], justEnough: true });
    expect(bands.map((b) => b.kind)).toEqual(['frosting', 'sponge', 'soak', 'filling', 'sponge', 'soak', 'filling', 'sponge', 'soak']);
  });
  it('puts the crust at the bottom of a cheesecake', () => {
    const tpl = componentTemplates('cheesecake', 'Lemon', 'Raspberry').map((t, i) => comp({ ...t, id: String(i) }));
    expect(crossSection(tpl, { shape: 'round', tiers: [{ sizeIn: 9, layers: 1 }], justEnough: true }).at(-1)!.kind).toBe('crust');
  });
});

describe('bake log', () => {
  const recipe: Recipe = { id: 'r', title: 'Curd', basePan: { shape: 'round', sizeIn: 8, layers: 3 }, yieldGrams: 400, ingredients: [], steps: [{ text: 'Chill {A2|about 4 hours}.' }], origin: 'ai', sourceUrl: null, createdAt: 0, updatedAt: 0 };
  const cite: Citation = { id: 'A2', recipeId: 'r', kind: 'assumption', title: 'Curd set time', detail: 'Estimated', why: 'Range', refs: [], url: null };
  const c = comp({ id: 'c1', name: 'Lemon curd', recipeId: 'r' });
  it('puts your note first and promotes measured values to tested', () => {
    const out = applyBakeLog(
      { id: 'l', projectId: 'p', bakedOn: '2026-12-12', notes: '', results: [{ componentId: 'c1', verdict: 'change', changeText: 'Use 3 lemons' }], measured: [{ recipeId: 'r', citationId: 'A2', value: 'set in 6 hours' }] },
      [c], [recipe], [cite],
    );
    expect(out.recipes[0].steps[0].text).toBe('{Y20261212|Last time: Use 3 lemons}');
    expect(out.citations.find((x) => x.id === 'A2')!.kind).toBe('tested');
    expect(out.citations.find((x) => x.id === 'Y20261212')!.kind).toBe('tested');
    expect(out.summary).toHaveLength(2);
  });
});

import { bakeTimeline } from '../plan';
import { processTasks, processTips } from '../processRules';
import { buildPrompt } from '../handoff';
import type { Project } from '../types';

describe('cheesecake and ice cream cake rules', () => {
  const base: Project = {
    id: 'p', title: 't', titleIsCustom: false, dessertType: 'cheesecake', status: 'planning', buildMode: 'know',
    request: { forWho: '', occasion: '', date: '', servings: 12, words: '' }, flavors: { primary: null, pairings: [], custom: [] },
    size: { shape: 'round', tiers: [{ sizeIn: 9, layers: 1 }], justEnough: true }, createdAt: 0, updatedAt: 0,
  };
  it('baked cheesecake cools in the oven and chills overnight, all sourced', () => {
    const tasks = processTasks(base);
    expect(tasks.map((t) => t.text).join(' ')).toMatch(/door cracked.*overnight/);
    expect(tasks.every((t) => t.source.url.startsWith('https://'))).toBe(true);
  });
  it('no-bake and Basque get their own rules', () => {
    expect(processTasks({ ...base, variant: 'no-bake' })[0].text).toMatch(/6 hours/);
    expect(processTips({ ...base, variant: 'basque' })[0].text).toMatch(/No crust/);
    expect(componentTemplates('cheesecake', 'Lemon', '', 'basque').find((t) => t.kind === 'crust')!.included).toBe(false);
  });
  it('ice cream cake freezes 12 hours and comes out 10 minutes early', () => {
    const t = bakeTimeline({ ...base, dessertType: 'ice-cream-cake' }, []);
    const all = t.flatMap((d) => d.tasks.map((x) => x.text)).join(' | ');
    expect(all).toMatch(/at least 12 hours/);
    expect(t.at(-1)!.tasks.map((x) => x.text)).toContain('Take it out about 10 minutes before serving');
  });
  it('puts the rules in the Claude prompt', () => {
    expect(buildPrompt({ ...base, variant: 'baked' }, [], [])).toMatch(/water bath/);
  });
});

import { panArea, scaleFactor } from '../scaling';
import { defaultSize, sectionForm, styleOf } from '../styles';
import { assemblyText } from '../processRules';
import { componentGaps } from '../plan';
import { rollSpiral } from '../stack';

describe('cake styles and tarts (pies, tarts & other cakes research)', () => {
  const base: Project = {
    id: 'p', title: 't', titleIsCustom: false, dessertType: 'cake', status: 'planning', buildMode: 'know',
    request: { forWho: '', occasion: '', date: '', servings: 12, words: '' },
    flavors: { primary: null, pairings: [], custom: [] },
    size: { shape: 'round', tiers: [{ sizeIn: 8, layers: 3 }], justEnough: true }, createdAt: 0, updatedAt: 0,
  };
  const styles = ['entremet', 'cupcake', 'bundt', 'chiffon', 'angel-food', 'roll'] as const;

  it('unset cake style is a layer cake; a cheesecake style does not leak into a cake', () => {
    expect(styleOf(base)).toBe('layer');
    expect(styleOf({ ...base, variant: 'basque' })).toBe('layer');
    expect(styleOf({ ...base, dessertType: 'tart' })).toBe('set');
  });

  it('every cake style has its own pan, components and sourced tips', () => {
    for (const s of styles) {
      const p = { ...base, variant: s };
      expect(defaultSize(s, 12).shape).not.toBe('round');
      expect(componentTemplates('cake', 'Lemon', 'Raspberry', s).length).toBeGreaterThan(1);
      const tips = processTips(p);
      expect(tips.length).toBeGreaterThan(0);
      for (const t of [...tips, ...processTasks(p)]) expect(t.source.url).toMatch(/^https:\/\//);
      expect(assemblyText(p)).not.toBe('Assemble and chill');
    }
  });

  it('entremet plans three days ahead and glazes the day before', () => {
    const p = { ...base, variant: 'entremet' as const };
    const tpl = componentTemplates('cake', 'Mango', 'Passion fruit', 'entremet').map((t, i) => comp({ ...t, id: String(i) }));
    const days = bakeTimeline(p, tpl).map((d) => d.offset);
    expect(days[0]).toBe(-3);
    expect(processTasks(p).find((t) => t.offset === -1)!.text).toMatch(/90–94°F/);
    const bands = crossSection(tpl, p.size).map((b) => b.kind);
    expect(bands[0]).toBe('glaze');
    expect(bands.indexOf('insert')).toBeGreaterThan(bands.indexOf('mousse'));
    expect(bands.lastIndexOf('mousse')).toBeGreaterThan(bands.indexOf('insert'));
  });

  it('roll cakes draw as a swirl of sponge and filling', () => {
    const p = { ...base, variant: 'roll' as const };
    expect(sectionForm(p)).toBe('swirl');
    expect(sectionForm(base)).toBe(base.size?.shape === 'round' ? 'iso' : 'stack'); // round cakes draw in 3D (2026-11-28)
    const tpl = componentTemplates('cake', 'Matcha', 'Strawberry', 'roll').map((t, i) => comp({ ...t, id: String(i) }));
    expect(rollSpiral(tpl).map((b) => b.kind)).toEqual(['sponge', 'filling', 'sponge', 'filling', 'sponge', 'filling']);
  });

  it('cupcakes scale by count: two 8 in layers make 18–24 (Handle the Heat)', () => {
    const cupcakes = (2 * panArea('round', 8)) / panArea('cupcake', 1);
    expect(cupcakes).toBeGreaterThanOrEqual(18);
    expect(cupcakes).toBeLessThanOrEqual(24);
  });

  it('a 10 in Bundt holds about two 9 in layers', () => {
    expect(scaleFactor({ shape: 'round', sizeIn: 9, layers: 2 }, { shape: 'bundt', tiers: [{ sizeIn: 10, layers: 1 }], justEnough: true })).toBeCloseTo(1, 1);
  });

  it('only layer cakes get the dry-sponge warning', () => {
    const sponge = [comp({ kind: 'sponge', id: 's' })];
    expect(componentGaps(base, sponge).length).toBe(1);
    expect(componentGaps({ ...base, variant: 'bundt' }, sponge).length).toBe(0);
  });

  it('tarts: set filling goes in a baked shell; baked filling bakes with it', () => {
    const set = { ...base, dessertType: 'tart' as const };
    const baked = { ...set, variant: 'baked' as const };
    expect(processTasks(set)[0].text).toMatch(/Freeze the shell/);
    expect(processTips(set)[0].text).toMatch(/Blind bake at 350°F/);
    expect(processTips(baked)[0].text).toMatch(/pre-cook/);
    expect(componentTemplates('tart', 'Almond', 'Apricot', 'baked').map((t) => t.name)).toContain('Almond frangipane');
  });
});
