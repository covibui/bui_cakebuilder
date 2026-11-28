import { describe, expect, it } from 'vitest';
import { CAKE_COLORS, closestCakeColor, flavorColor } from '../cakeColors';
import { SEED_FLAVORS } from '../flavors';
import { crossSection } from '../stack';
import type { Component } from '../types';

const lum = (hex: string) => {
  const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

describe('cake palette', () => {
  it('every swatch label passes 4.5:1 with its ink', () => {
    for (const [name, c] of Object.entries(CAKE_COLORS)) {
      const ink = c.ink === 'milk' ? '#FBF6EF' : '#4A342C';
      expect(contrast(c.hex, ink), name).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('gives every seed flavor a color', () => {
    for (const f of SEED_FLAVORS) expect(CAKE_COLORS[f.color], f.name).toBeDefined();
  });
  it('matches flavors by ingredient', () => {
    expect(flavorColor('Red velvet', 'cake')).toBe('cake-red-velvet');
    expect(flavorColor('Chocolate pistachio (Dubai style)', 'cake')).toBe('cake-chocolate');
    expect(flavorColor('White chocolate raspberry', 'cheesecake')).toBe('cake-raspberry');
    expect(flavorColor('Key lime', 'cheesecake')).toBe('cake-lime');
  });
  it('colors components by kind', () => {
    expect(closestCakeColor('Lemon sponge', 'sponge')).toBe('cake-golden');
    expect(closestCakeColor('Lemon filling', 'filling')).toBe('cake-lemon');
    expect(closestCakeColor('Chocolate buttercream', 'frosting')).toBe('cake-mocha');
    expect(closestCakeColor('Key lime cheesecake filling', 'base')).toBe('cake-cream-cheese');
    expect(closestCakeColor('Cookie crust', 'crust')).toBe('cake-graham');
    expect(closestCakeColor('Tart shell', 'crust')).toBe('cake-pastry');
    expect(closestCakeColor('Fudge crunch layer', 'crunch')).toBe('cake-ganache');
    expect(closestCakeColor('Whipped cream finish', 'frosting')).toBe('cake-meringue');
  });
  it('custom flavors borrow the closest color, with a plain fallback', () => {
    expect(flavorColor('Blackberry sage', 'cake')).toBe('cake-vanilla');
    expect(flavorColor('Sour cherry almond', 'cake')).toBe('cake-vanilla');
    expect(closestCakeColor('Sour cherry compote', 'filling')).toBe('cake-cherry');
  });
  it('cross-section bands carry a color', () => {
    const c = (o: Partial<Component>): Component => ({ id: 'x', projectId: 'p', kind: 'sponge', name: 'Lemon sponge', why: '', tag: 'base', included: true, makeAheadDay: -1, recipeId: null, feeds: [], ...o });
    const bands = crossSection([c({ id: 'a' }), c({ id: 'b', kind: 'filling', name: 'Raspberry filling' })], { shape: 'round', tiers: [{ sizeIn: 8, layers: 2 }], justEnough: true });
    expect(bands.map((b) => b.color)).toEqual(['cake-golden', 'cake-raspberry', 'cake-golden']);
  });
});
